<script lang="ts">
import Icon from "@iconify/svelte";
import {
	formatMetric,
	getAnonymousId,
	requestSiteMetrics,
} from "@utils/site-metrics";
import { onMount } from "svelte";

type StateResponse = {
	likes: number;
	views: number;
	liked: boolean;
};

type LikeResponse = {
	likes: number;
	liked: boolean;
};

const VISITOR_KEY = "yestugit-like-visitor-id";

let visitorId = "";
let likes: number | null = null;
let liked = false;
let isLoading = true;
let isSaving = false;
let error = "";

onMount(() => {
	visitorId = getAnonymousId(localStorage, VISITOR_KEY);
	void loadState();
});

async function loadState() {
	isLoading = true;
	error = "";
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const state = await requestSiteMetrics<StateResponse>("/api/state", {
				method: "POST",
				body: JSON.stringify({ visitorId }),
			});
			likes = state.likes;
			liked = state.liked;
			isLoading = false;
			return;
		} catch {
			if (attempt === 0)
				await new Promise((resolve) => window.setTimeout(resolve, 1000));
		}
	}
	isLoading = false;
	error = "点赞服务暂时不可用";
}

async function toggleLike() {
	if (isLoading || isSaving || likes === null) return;
	const previousLiked = liked;
	const previousLikes = likes;
	const nextLiked = !liked;

	liked = nextLiked;
	likes = Math.max(0, likes + (nextLiked ? 1 : -1));
	isSaving = true;
	error = "";

	try {
		const result = await requestSiteMetrics<LikeResponse>("/api/like", {
			method: "PUT",
			body: JSON.stringify({ visitorId, liked: nextLiked }),
		});
		liked = result.liked;
		likes = result.likes;
	} catch {
		liked = previousLiked;
		likes = previousLikes;
		error = "没有保存成功，请稍后再试";
	} finally {
		isSaving = false;
	}
}
</script>

<section class="reaction-card card-base" aria-label="为橘の記録点赞">
	<div class="glow" aria-hidden="true"></div>
	<button
		type="button"
		class:liked
		class:saving={isSaving}
		onclick={toggleLike}
		disabled={isLoading || isSaving || likes === null}
		aria-pressed={liked}
		aria-label={liked ? "取消点赞" : "点赞"}
	>
		<span class="heart-ripple" aria-hidden="true"></span>
		<Icon icon={liked ? "material-symbols:favorite-rounded" : "material-symbols:favorite-outline-rounded"} />
	</button>
	<div class="like-count" aria-live="polite">
		<strong>{formatMetric(likes)}</strong>
		<span>次喜欢</span>
	</div>
	<p>如果你觉得我的帖子对你有帮助，就给 <strong>橘の記録</strong> 点个赞吧。</p>
	{#if error}
		<button class="retry" type="button" onclick={loadState}>{error} · 重试</button>
	{/if}
</section>

<style>
	.reaction-card {
		position: relative;
		padding: 1.15rem 1rem 1rem;
		text-align: center;
		isolation: isolate;
	}

	.glow {
		position: absolute;
		top: -2rem;
		left: 50%;
		z-index: -1;
		width: 7rem;
		height: 5rem;
		border-radius: 50%;
		background: oklch(0.78 0.15 var(--hue) / 0.14);
		filter: blur(1.6rem);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.reaction-card > button:not(.retry) {
		position: relative;
		display: grid;
		place-items: center;
		width: 3.4rem;
		height: 3.4rem;
		margin: 0 auto 0.25rem;
		border: 1px solid oklch(0.76 0.12 var(--hue) / 0.24);
		border-radius: 50%;
		color: oklch(0.62 0.16 var(--hue));
		background: oklch(0.95 0.03 var(--hue) / 0.72);
		box-shadow: 0 0.55rem 1.3rem oklch(0.52 0.11 var(--hue) / 0.14);
		cursor: pointer;
		transition: color 180ms ease, background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
	}

	.reaction-card > button:not(.retry):hover:not(:disabled) { transform: translateY(-0.12rem) scale(1.04); }
	.reaction-card > button:not(.retry):active:not(:disabled) { transform: scale(0.9); }
	.reaction-card > button:not(.retry):disabled { cursor: wait; opacity: 0.55; }
	.reaction-card > button.liked { color: white; background: linear-gradient(145deg, oklch(0.75 0.18 25), oklch(0.62 0.22 12)); box-shadow: 0 0.65rem 1.5rem oklch(0.58 0.18 20 / 0.3); animation: heart-pop 360ms ease-out; }
	.reaction-card > button.saving { animation: breathe 850ms ease-in-out infinite alternate; }
	.reaction-card :global(svg) { position: relative; z-index: 1; font-size: 1.75rem; }

	.heart-ripple { position: absolute; inset: -0.1rem; border: 1px solid currentColor; border-radius: 50%; opacity: 0; }
	.liked .heart-ripple { animation: ripple 520ms ease-out; }

	.like-count { display: flex; align-items: baseline; justify-content: center; gap: 0.28rem; color: rgb(0 0 0 / 0.42); }
	.like-count strong { color: rgb(0 0 0 / 0.78); font-size: 1.05rem; font-variant-numeric: tabular-nums; }
	.like-count span { font-size: 0.68rem; }
	.reaction-card p { max-width: 14rem; margin: 0.55rem auto 0; color: rgb(0 0 0 / 0.43); font-size: 0.72rem; line-height: 1.55; }
	.reaction-card p strong { color: var(--primary); font-weight: 700; }
	.retry { margin-top: 0.45rem; border: 0; color: rgb(196 74 84); background: transparent; font-size: 0.65rem; cursor: pointer; }

	:global(:root.dark) .like-count, :global(:root.dark) .reaction-card p { color: rgb(255 255 255 / 0.43); }
	:global(:root.dark) .like-count strong { color: rgb(255 255 255 / 0.82); }
	:global(:root.dark) .reaction-card > button:not(.retry) { background: oklch(0.34 0.06 var(--hue) / 0.7); }

	@keyframes heart-pop { 45% { transform: scale(1.16) rotate(-6deg); } 75% { transform: scale(0.96) rotate(3deg); } }
	@keyframes ripple { from { opacity: 0.45; transform: scale(0.8); } to { opacity: 0; transform: scale(1.5); } }
	@keyframes breathe { from { transform: scale(0.96); } to { transform: scale(1.03); } }

	@media (prefers-reduced-motion: reduce) {
		.reaction-card > button, .liked .heart-ripple { animation: none; transition: none; }
	}
</style>
