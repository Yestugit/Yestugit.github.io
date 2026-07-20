import { siteMetricsConfig } from "@/config";

const REQUEST_TIMEOUT_MS = 6000;

export async function requestSiteMetrics<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const baseUrl = siteMetricsConfig.apiBaseUrl.replace(/\/$/, "");
	if (!baseUrl) throw new Error("Site metrics API is not configured");

	const controller = new AbortController();
	const timeout = window.setTimeout(
		() => controller.abort(),
		REQUEST_TIMEOUT_MS,
	);

	try {
		const response = await fetch(`${baseUrl}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...init?.headers,
			},
			signal: controller.signal,
		});
		if (!response.ok)
			throw new Error(`Site metrics request failed: ${response.status}`);
		return (await response.json()) as T;
	} finally {
		window.clearTimeout(timeout);
	}
}

export function getAnonymousId(storage: Storage, key: string): string {
	const existing = storage.getItem(key);
	if (
		existing &&
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			existing,
		)
	) {
		return existing;
	}

	const id = crypto.randomUUID();
	storage.setItem(key, id);
	return id;
}

export function formatMetric(value: number | null): string {
	return value === null ? "—" : new Intl.NumberFormat("zh-CN").format(value);
}
