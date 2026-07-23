-- Keep the existing rows, but give the table a name that reflects its new
-- purpose: from this migration onward it stores one persistent browser ID per
-- visitor rather than one ID per browser session.
ALTER TABLE page_view_sessions RENAME TO site_visitors;
ALTER TABLE site_visitors RENAME COLUMN session_hash TO visitor_hash;

-- Reading two aggregate rows is constant-cost, unlike COUNT(*) over every
-- stored visitor and like on every API request.
CREATE TABLE IF NOT EXISTS site_metric_totals (
	metric TEXT PRIMARY KEY CHECK (metric IN ('likes', 'views')),
	value INTEGER NOT NULL DEFAULT 0 CHECK (value >= 0)
);

INSERT OR IGNORE INTO site_metric_totals (metric, value)
VALUES ('likes', 0), ('views', 0);

-- Preserve the totals collected before this migration. New rows are then kept
-- in sync by triggers below.
UPDATE site_metric_totals
SET value = (SELECT COUNT(*) FROM site_likes)
WHERE metric = 'likes';

UPDATE site_metric_totals
SET value = (SELECT COUNT(*) FROM site_visitors)
WHERE metric = 'views';

CREATE TRIGGER IF NOT EXISTS site_likes_increment_total
AFTER INSERT ON site_likes
BEGIN
	UPDATE site_metric_totals SET value = value + 1 WHERE metric = 'likes';
END;

CREATE TRIGGER IF NOT EXISTS site_likes_decrement_total
AFTER DELETE ON site_likes
BEGIN
	UPDATE site_metric_totals
	SET value = CASE WHEN value > 0 THEN value - 1 ELSE 0 END
	WHERE metric = 'likes';
END;

CREATE TRIGGER IF NOT EXISTS site_visitors_increment_total
AFTER INSERT ON site_visitors
BEGIN
	UPDATE site_metric_totals SET value = value + 1 WHERE metric = 'views';
END;

-- A short-lived bucket limits mass writes from one source network. The stored
-- value is a salted hash, never a raw IP address.
CREATE TABLE IF NOT EXISTS site_metric_rate_limits (
	fingerprint TEXT NOT NULL,
	action TEXT NOT NULL CHECK (action IN ('like', 'view')),
	bucket_start INTEGER NOT NULL,
	attempts INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (fingerprint, action, bucket_start)
);
