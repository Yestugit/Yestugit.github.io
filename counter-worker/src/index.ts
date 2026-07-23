interface D1Result<T = unknown> {
	results: T[];
	meta: { changes?: number };
}

interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T = Record<string, unknown>>(): Promise<T | null>;
	all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
	run<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
	prepare(query: string): D1PreparedStatement;
}

interface Env {
	DB: D1Database;
	RATE_LIMIT_SALT?: string;
}

type JsonRecord = Record<string, unknown>;

const PRODUCTION_ORIGIN = "https://yestugit.github.io";
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_LENGTH = 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMITS = { like: 12, view: 24 } as const;

function isAllowedOrigin(origin: string | null): boolean {
	return (
		origin === PRODUCTION_ORIGIN ||
		Boolean(origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
	);
}

function corsHeaders(origin: string | null): HeadersInit {
	return {
		...(origin && isAllowedOrigin(origin)
			? { "Access-Control-Allow-Origin": origin }
			: {}),
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
		"Cache-Control": "no-store",
		"Content-Type": "application/json; charset=utf-8",
		Vary: "Origin",
	};
}

function json(
	data: JsonRecord,
	status = 200,
	origin: string | null = null,
): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: corsHeaders(origin),
	});
}

async function parseJsonBody(request: Request): Promise<JsonRecord> {
	if (
		!request.headers
			.get("content-type")
			?.toLowerCase()
			.startsWith("application/json")
	) {
		throw new Error("Content-Type must be application/json");
	}
	const declaredLength = Number(request.headers.get("content-length") ?? "0");
	if (declaredLength > MAX_BODY_LENGTH)
		throw new Error("Request body is too large");
	const text = await request.text();
	if (!text || text.length > MAX_BODY_LENGTH)
		throw new Error("Invalid request body");
	const value = JSON.parse(text) as unknown;
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Invalid JSON object");
	return value as JsonRecord;
}

function readUuid(body: JsonRecord, key: "visitorId"): string {
	const value = body[key];
	if (typeof value !== "string" || !UUID_PATTERN.test(value))
		throw new Error(`Invalid ${key}`);
	return value.toLowerCase();
}

async function hashId(value: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

async function getCounts(
	db: D1Database,
): Promise<{ likes: number; views: number }> {
	const result = await db
		.prepare(
			"SELECT metric, value FROM site_metric_totals WHERE metric IN ('likes', 'views')",
		)
		.all<{ metric: "likes" | "views"; value: number }>();
	const totals = new Map(result.results.map((row) => [row.metric, row.value]));
	return {
		likes: Number(totals.get("likes") ?? 0),
		views: Number(totals.get("views") ?? 0),
	};
}

async function enforceRateLimit(
	request: Request,
	env: Env,
	action: keyof typeof RATE_LIMITS,
) {
	const ip = request.headers.get("CF-Connecting-IP");
	if (!ip) return;

	const fingerprint = await hashId(`${env.RATE_LIMIT_SALT ?? ""}:${ip}`);
	const bucketStart = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
	const result = await env.DB
		.prepare(
			"INSERT INTO site_metric_rate_limits (fingerprint, action, bucket_start, attempts) VALUES (?, ?, ?, 1) ON CONFLICT(fingerprint, action, bucket_start) DO UPDATE SET attempts = attempts + 1 WHERE attempts < ?",
		)
		.bind(fingerprint, action, bucketStart, RATE_LIMITS[action])
		.run();

	if (Number(result.meta.changes ?? 0) !== 1)
		throw new Error("Too many requests");
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
	const origin = request.headers.get("origin");
	if (!isAllowedOrigin(origin))
		return json({ error: "Origin is not allowed" }, 403, origin);
	if (request.method === "OPTIONS")
		return new Response(null, { status: 204, headers: corsHeaders(origin) });

	const url = new URL(request.url);
	try {
		if (url.pathname === "/api/stats" && request.method === "GET") {
			return json(await getCounts(env.DB), 200, origin);
		}

		if (url.pathname === "/api/state" && request.method === "POST") {
			const body = await parseJsonBody(request);
			const visitorHash = await hashId(readUuid(body, "visitorId"));
			const [counts, row] = await Promise.all([
				getCounts(env.DB),
				env.DB.prepare(
					"SELECT 1 AS liked FROM site_likes WHERE visitor_hash = ? LIMIT 1",
				)
					.bind(visitorHash)
					.first<{ liked: number }>(),
			]);
			return json({ ...counts, liked: Boolean(row?.liked) }, 200, origin);
		}

		if (url.pathname === "/api/like" && request.method === "PUT") {
			await enforceRateLimit(request, env, "like");
			const body = await parseJsonBody(request);
			const visitorHash = await hashId(readUuid(body, "visitorId"));
			if (typeof body.liked !== "boolean")
				throw new Error("Invalid liked value");
			if (body.liked) {
				await env.DB.prepare(
					"INSERT OR IGNORE INTO site_likes (visitor_hash) VALUES (?)",
				)
					.bind(visitorHash)
					.run();
			} else {
				await env.DB.prepare("DELETE FROM site_likes WHERE visitor_hash = ?")
					.bind(visitorHash)
					.run();
			}
			const counts = await getCounts(env.DB);
			return json({ likes: counts.likes, liked: body.liked }, 200, origin);
		}

		if (url.pathname === "/api/view" && request.method === "POST") {
			await enforceRateLimit(request, env, "view");
			const body = await parseJsonBody(request);
			const visitorHash = await hashId(readUuid(body, "visitorId"));
			const result = await env.DB.prepare(
				"INSERT OR IGNORE INTO site_visitors (visitor_hash) VALUES (?)",
			)
				.bind(visitorHash)
				.run();
			const counts = await getCounts(env.DB);
			return json(
				{ views: counts.views, counted: Number(result.meta.changes ?? 0) > 0 },
				200,
				origin,
			);
		}

		return json({ error: "Not found" }, 404, origin);
	} catch (error) {
		if (
			error instanceof SyntaxError ||
			(error instanceof Error &&
				/Invalid|Content-Type|too large|Too many requests/.test(error.message))
		) {
			return json(
				{ error: error instanceof Error ? error.message : "Invalid request" },
				error instanceof Error && error.message === "Too many requests"
					? 429
					: 400,
				origin,
			);
		}
		console.error("Site metrics request failed", error);
		return json({ error: "Internal server error" }, 500, origin);
	}
}

export default {
	fetch(request: Request, env: Env): Promise<Response> {
		return handleRequest(request, env);
	},
};
