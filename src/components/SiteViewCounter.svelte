<script lang="ts">
import Icon from "@iconify/svelte";
import {
	formatMetric,
	getAnonymousId,
	requestSiteMetrics,
} from "@utils/site-metrics";
import { onMount } from "svelte";

type StatsResponse = { likes: number; views: number };
type ViewResponse = { views: number; counted: boolean };

const SESSION_ID_KEY = "yestugit-home-session-id";
const SESSION_COUNTED_KEY = "yestugit-home-session-counted";

let views: number | null = null;
let unavailable = false;
let requestPending = false;

onMount(() => {
	const refresh = () => void loadViews();
	const refreshWhenVisible = () => {
		if (document.visibilityState === "visible") refresh();
	};

	window.addEventListener("focus", refresh);
	document.addEventListener("visibilitychange", refreshWhenVisible);
	document.addEventListener("swup:page:view", refresh);
	void loadViews();

	return () => {
		window.removeEventListener("focus", refresh);
		document.removeEventListener("visibilitychange", refreshWhenVisible);
		document.removeEventListener("swup:page:view", refresh);
	};
});

function isHomePage(): boolean {
	const normalize = (path: string) =>
		path.replace(/^\/+|\/+$/g, "").toLowerCase();
	const homePath = new URL(import.meta.env.BASE_URL, window.location.origin)
		.pathname;
	return normalize(window.location.pathname) === normalize(homePath);
}

async function loadViews() {
	if (requestPending) return;
	requestPending = true;

	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			if (
				isHomePage() &&
				sessionStorage.getItem(SESSION_COUNTED_KEY) !== "true"
			) {
				const sessionId = getAnonymousId(sessionStorage, SESSION_ID_KEY);
				const result = await requestSiteMetrics<ViewResponse>("/api/view", {
					method: "POST",
					body: JSON.stringify({ sessionId }),
				});
				views = result.views;
				sessionStorage.setItem(SESSION_COUNTED_KEY, "true");
			} else {
				const result = await requestSiteMetrics<StatsResponse>("/api/stats");
				views = result.views;
			}
			unavailable = false;
			requestPending = false;
			return;
		} catch {
			if (attempt === 0)
				await new Promise((resolve) => window.setTimeout(resolve, 1000));
		}
	}
	unavailable = true;
	requestPending = false;
}
</script>

<div class="view-counter" aria-live="polite" title={unavailable ? "访问量服务暂时不可用" : undefined}>
	<Icon icon="material-symbols:visibility-outline-rounded" />
	<span>本站已被访问 <strong>{formatMetric(views)}</strong> 次</span>
</div>

<style>
	.view-counter { display: flex; align-items: center; justify-content: center; gap: 0.38rem; margin-bottom: 0.75rem; color: rgb(0 0 0 / 0.38); font-size: 0.72rem; }
	.view-counter :global(svg) { color: var(--primary); font-size: 1rem; opacity: 0.75; }
	.view-counter strong { color: rgb(0 0 0 / 0.62); font-weight: 700; font-variant-numeric: tabular-nums; }
	:global(:root.dark) .view-counter { color: rgb(255 255 255 / 0.38); }
	:global(:root.dark) .view-counter strong { color: rgb(255 255 255 / 0.62); }
</style>
