interface D1Result<T = unknown> {
	results: T[];
	meta: { changes?: number };
}

interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T = Record<string, unknown>>(): Promise<T | null>;
	run<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
	prepare(query: string): D1PreparedStatement;
}

interface Env {
	DB: D1Database;
}

type JsonRecord = Record<string, unknown>;

const PRODUCTION_ORIGIN = "https://yestugit.github.io";
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_LENGTH = 1024;

function isAllowedOrigin(origin: string | null): boolean {
	if (!origin) return true;
	return (
		origin === PRODUCTION_ORIGIN ||
		/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
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

function readUuid(body: JsonRecord, key: "visitorId" | "sessionId"): string {
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
	const [likeRow, viewRow] = await Promise.all([
		db
			.prepare("SELECT COUNT(*) AS count FROM site_likes")
			.first<{ count: number }>(),
		db
			.prepare("SELECT COUNT(*) AS count FROM page_view_sessions")
			.first<{ count: number }>(),
	]);
	return {
		likes: Number(likeRow?.count ?? 0),
		views: Number(viewRow?.count ?? 0),
	};
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
			const body = await parseJsonBody(request);
			const sessionHash = await hashId(readUuid(body, "sessionId"));
			const result = await env.DB.prepare(
				"INSERT OR IGNORE INTO page_view_sessions (session_hash) VALUES (?)",
			)
				.bind(sessionHash)
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
				/Invalid|Content-Type|too large/.test(error.message))
		) {
			return json(
				{ error: error instanceof Error ? error.message : "Invalid request" },
				400,
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
