<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount, tick } from "svelte";
import departuresSrc from "../../music/Departures 〜あなたにおくるアイの歌〜 - EGOIST - APLMate.com.mp3?url";
import myDearestSrc from "../../music/My Dearest - supercell - APLMate.com.mp3?url";
import planetesSrc from "../../music/Planetes - EGOIST - APLMate.com.mp3?url";

type Track = {
	title: string;
	artist: string;
	src: string;
};

type SavedPosition = {
	x: number;
	y: number;
};

const tracks: Track[] = [
	{
		title: "Departures 〜あなたにおくるアイの歌〜",
		artist: "EGOIST",
		src: departuresSrc,
	},
	{ title: "My Dearest", artist: "supercell", src: myDearestSrc },
	{ title: "Planetes", artist: "EGOIST", src: planetesSrc },
];

let audio: HTMLAudioElement;
let player: HTMLElement;
let currentTrack = 0;
let isPlaying = false;
let isExpanded = false;
let isCollapsed = false;
let currentTime = 0;
let duration = 0;
let volume = 0.7;
let playbackError = "";

let hasCustomPosition = false;
let positionX = 0;
let positionY = 0;
let isDragging = false;
let dragTimer: ReturnType<typeof setTimeout> | undefined;
let dragPointerId = -1;
let dragStartPointerX = 0;
let dragStartPointerY = 0;
let dragStartPlayerX = 0;
let dragStartPlayerY = 0;

onMount(() => {
	const storedVolume = Number.parseFloat(
		localStorage.getItem("music-volume") ?? "",
	);
	if (Number.isFinite(storedVolume)) {
		volume = Math.min(1, Math.max(0, storedVolume));
	}
	audio.volume = volume;

	const savedPosition = localStorage.getItem("music-player-position");
	if (savedPosition) {
		try {
			const parsed = JSON.parse(savedPosition) as SavedPosition;
			if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
				hasCustomPosition = true;
				const nextPosition = clampPosition(parsed.x, parsed.y);
				positionX = nextPosition.x;
				positionY = nextPosition.y;
			}
		} catch {
			localStorage.removeItem("music-player-position");
		}
	}

	const handleResize = () => {
		if (!hasCustomPosition) return;
		const nextPosition = clampPosition(positionX, positionY);
		positionX = nextPosition.x;
		positionY = nextPosition.y;
		storePosition();
	};

	window.addEventListener("resize", handleResize);
	return () => {
		window.removeEventListener("resize", handleResize);
		if (dragTimer) clearTimeout(dragTimer);
		document.body.style.removeProperty("user-select");
	};
});

function formatTime(value: number) {
	if (!Number.isFinite(value) || value < 0) return "0:00";
	const minutes = Math.floor(value / 60);
	const seconds = Math.floor(value % 60)
		.toString()
		.padStart(2, "0");
	return `${minutes}:${seconds}`;
}

async function playCurrent() {
	playbackError = "";
	try {
		await audio.play();
	} catch {
		isPlaying = false;
		playbackError = "播放失败，请再试一次";
	}
}

async function togglePlay() {
	if (audio.paused) await playCurrent();
	else audio.pause();
}

async function selectTrack(index: number, shouldPlay = true) {
	currentTrack = (index + tracks.length) % tracks.length;
	currentTime = 0;
	duration = 0;
	await tick();
	audio.load();
	if (shouldPlay) await playCurrent();
}

async function toggleExpanded() {
	isExpanded = !isExpanded;
	await tick();
	if (!hasCustomPosition) return;
	requestAnimationFrame(() => {
		const nextPosition = clampPosition(positionX, positionY);
		positionX = nextPosition.x;
		positionY = nextPosition.y;
		storePosition();
	});
	setTimeout(() => {
		const nextPosition = clampPosition(positionX, positionY);
		positionX = nextPosition.x;
		positionY = nextPosition.y;
		storePosition();
	}, 300);
}

async function toggleCollapsed() {
	isCollapsed = !isCollapsed;
	isExpanded = false;
	await tick();
	if (!hasCustomPosition) return;
	requestAnimationFrame(() => {
		const nextPosition = clampPosition(positionX, positionY);
		positionX = nextPosition.x;
		positionY = nextPosition.y;
		storePosition();
	});
}

function seek(event: Event) {
	const target = event.currentTarget as HTMLInputElement;
	const nextTime = Number(target.value);
	audio.currentTime = nextTime;
	currentTime = nextTime;
}

function changeVolume(event: Event) {
	const target = event.currentTarget as HTMLInputElement;
	volume = Number(target.value);
	audio.volume = volume;
	localStorage.setItem("music-volume", String(volume));
}

function clampPosition(x: number, y: number) {
	const margin = 8;
	const rect = player.getBoundingClientRect();
	return {
		x: Math.min(
			Math.max(margin, x),
			Math.max(margin, window.innerWidth - rect.width - margin),
		),
		y: Math.min(
			Math.max(margin, y),
			Math.max(margin, window.innerHeight - rect.height - margin),
		),
	};
}

function storePosition() {
	localStorage.setItem(
		"music-player-position",
		JSON.stringify({ x: Math.round(positionX), y: Math.round(positionY) }),
	);
}

function isControl(target: EventTarget | null) {
	return (
		target instanceof Element && Boolean(target.closest("button, input, a"))
	);
}

function beginDragging(event: PointerEvent) {
	if (event.button !== 0 || isControl(event.target)) return;

	const rect = player.getBoundingClientRect();
	dragPointerId = event.pointerId;
	dragStartPointerX = event.clientX;
	dragStartPointerY = event.clientY;
	dragStartPlayerX = rect.left;
	dragStartPlayerY = rect.top;
	player.setPointerCapture(dragPointerId);

	dragTimer = setTimeout(() => {
		isDragging = true;
		hasCustomPosition = true;
		positionX = rect.left;
		positionY = rect.top;
		document.body.style.userSelect = "none";
	}, 150);
}

function dragPlayer(event: PointerEvent) {
	if (!isDragging || event.pointerId !== dragPointerId) return;
	event.preventDefault();
	const nextPosition = clampPosition(
		dragStartPlayerX + event.clientX - dragStartPointerX,
		dragStartPlayerY + event.clientY - dragStartPointerY,
	);
	positionX = nextPosition.x;
	positionY = nextPosition.y;
}

function finishDragging(event: PointerEvent) {
	if (dragTimer) {
		clearTimeout(dragTimer);
		dragTimer = undefined;
	}
	if (event.pointerId !== dragPointerId) return;
	if (player.hasPointerCapture(dragPointerId)) {
		player.releasePointerCapture(dragPointerId);
	}
	if (!isDragging) {
		dragPointerId = -1;
		return;
	}
	isDragging = false;
	dragPointerId = -1;
	document.body.style.removeProperty("user-select");
	storePosition();
}
</script>

<aside
	bind:this={player}
	class:collapsed={isCollapsed}
	class:expanded={isExpanded}
	class:dragging={isDragging}
	class="music-player"
	style={hasCustomPosition
		? `left:${positionX}px;top:${positionY}px;right:auto;bottom:auto;--progress:${duration ? (currentTime / duration) * 100 : 0}%`
		: `--progress:${duration ? (currentTime / duration) * 100 : 0}%`}
	aria-label="音乐播放器"
	onpointerdown={beginDragging}
	onpointermove={dragPlayer}
	onpointerup={finishDragging}
	onpointercancel={finishDragging}
>
	<audio
		bind:this={audio}
		src={tracks[currentTrack].src}
		preload="metadata"
		onplay={() => (isPlaying = true)}
		onpause={() => (isPlaying = false)}
		onended={() => selectTrack(currentTrack + 1)}
		onloadedmetadata={() => (duration = audio.duration)}
		ondurationchange={() => (duration = audio.duration)}
		ontimeupdate={() => (currentTime = audio.currentTime)}
		onerror={() => (playbackError = "这首歌暂时无法播放")}
	></audio>

	{#if isCollapsed}
		<button
			class="collapsed-toggle"
			type="button"
			onclick={toggleCollapsed}
			aria-label="Expand music player"
			title="Expand music player"
		>
			<Icon icon={isPlaying ? "material-symbols:graphic-eq-rounded" : "material-symbols:music-note-rounded"} />
		</button>
	{:else}
	<div class="aurora" aria-hidden="true"></div>
	<div class="drag-handle" aria-hidden="true">
		<span></span><span></span><span></span><span></span><span></span>
		<small>按住拖动</small>
	</div>

	<div class="player-main">
		<div class="vinyl-shell" class:playing={isPlaying} aria-hidden="true">
			<div class="vinyl">
				<span class="vinyl-groove groove-one"></span>
				<span class="vinyl-groove groove-two"></span>
				<span class="vinyl-label"><Icon icon="material-symbols:music-note-rounded" /></span>
			</div>
			<div class="tonearm"></div>
		</div>

		<div class="track-panel">
			<div class="status-line">
				<span class="playing-dot" class:active={isPlaying}></span>
				<span>{isPlaying ? "NOW PLAYING" : "READY TO PLAY"}</span>
				<span class="track-count">{String(currentTrack + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}</span>
			</div>
			<div class="track-title" title={tracks[currentTrack].title}>{tracks[currentTrack].title}</div>
			<div class="track-artist">{tracks[currentTrack].artist}</div>

			<div class="progress-wrap">
				<input
					class="progress"
					type="range"
					min="0"
					max={duration || 0}
					step="0.1"
					value={currentTime}
					oninput={seek}
					aria-label="播放进度"
				/>
				<div class="time-row">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="control-deck">
		<button type="button" onclick={() => selectTrack(currentTrack - 1)} aria-label="上一首">
			<Icon icon="material-symbols:skip-previous-rounded" />
		</button>
		<button class="play-button" type="button" onclick={togglePlay} aria-label={isPlaying ? "暂停" : "播放"}>
			<span class="play-halo"></span>
			<Icon icon={isPlaying ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} />
		</button>
		<button type="button" onclick={() => selectTrack(currentTrack + 1)} aria-label="下一首">
			<Icon icon="material-symbols:skip-next-rounded" />
		</button>
		<div class="deck-divider"></div>
		<button type="button" onclick={toggleCollapsed} aria-label="Collapse music player" title="Collapse music player">
			<Icon icon="material-symbols:keyboard-arrow-down-rounded" />
		</button>
		<button class="list-button" class:active={isExpanded} type="button" onclick={toggleExpanded} aria-label={isExpanded ? "收起播放列表" : "展开播放列表"} aria-expanded={isExpanded}>
			<Icon icon="material-symbols:queue-music-rounded" />
		</button>
	</div>

	<div class="expanded-content" aria-hidden={!isExpanded} inert={!isExpanded}>
		<div class="expanded-head">
			<span>PLAYLIST</span>
			<div class="volume-row">
				<Icon icon={volume === 0 ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} />
				<input type="range" min="0" max="1" step="0.05" value={volume} style={`--volume:${volume * 100}%`} oninput={changeVolume} aria-label="音量" />
			</div>
		</div>

		<div class="playlist" aria-label="播放列表">
			{#each tracks as track, index}
				<button
					type="button"
					class:active={index === currentTrack}
					onclick={() => selectTrack(index)}
					aria-label={`播放 ${track.title}`}
				>
					<span class="track-number">
						{#if index === currentTrack && isPlaying}
							<span class="mini-wave"><i></i><i></i><i></i></span>
						{:else}
							{String(index + 1).padStart(2, "0")}
						{/if}
					</span>
					<span class="playlist-copy">
						<strong>{track.title}</strong>
						<small>{track.artist}</small>
					</span>
					<Icon class="row-play" icon={index === currentTrack && isPlaying ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} />
				</button>
			{/each}
		</div>
		{#if playbackError}<p class="error" role="status">{playbackError}</p>{/if}
	</div>
	{/if}
</aside>

<style>
	.music-player {
		position: fixed;
		right: max(1rem, env(safe-area-inset-right));
		bottom: max(1rem, env(safe-area-inset-bottom));
		z-index: 70;
		width: min(23rem, calc(100vw - 2rem));
		padding: 1rem;
		border: 1px solid rgb(255 255 255 / 0.62);
		border-radius: 1.65rem;
		background:
			linear-gradient(145deg, rgb(255 255 255 / 0.92), rgb(247 245 255 / 0.82));
		box-shadow:
			0 1.5rem 4rem rgb(47 35 91 / 0.22),
			inset 0 1px 0 rgb(255 255 255 / 0.8);
		backdrop-filter: blur(24px) saturate(1.3);
		-webkit-backdrop-filter: blur(24px) saturate(1.3);
		touch-action: none;
		cursor: grab;
		user-select: none;
		overflow: hidden;
		transition: box-shadow 180ms ease, border-color 180ms ease;
	}

	.music-player::after {
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: radial-gradient(circle at 80% 0%, oklch(0.8 0.13 var(--hue) / 0.19), transparent 42%);
		content: "";
		pointer-events: none;
	}

	.music-player.dragging {
		cursor: grabbing;
		box-shadow:
			0 2rem 5rem rgb(47 35 91 / 0.3),
			0 0 0 3px oklch(0.72 0.16 var(--hue) / 0.2);
	}

	.music-player.collapsed {
		width: 3.4rem;
		height: 3.4rem;
		padding: 0.3rem;
		border-radius: 50%;
		cursor: default;
	}

	.collapsed-toggle {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border: 0;
		border-radius: inherit;
		color: white;
		background: linear-gradient(145deg, oklch(0.73 0.18 var(--hue)), oklch(0.56 0.21 var(--hue)));
		box-shadow: 0 0.45rem 1.15rem oklch(0.52 0.16 var(--hue) / 0.36);
		cursor: pointer;
		transition: transform 150ms ease, filter 150ms ease;
	}

	.collapsed-toggle:hover { filter: brightness(1.08); }
	.collapsed-toggle:active { transform: scale(0.9); }
	.collapsed-toggle :global(svg) { font-size: 1.45rem; }

	:global(:root.dark) .music-player {
		border-color: rgb(255 255 255 / 0.1);
		background: linear-gradient(145deg, rgb(30 27 43 / 0.94), rgb(19 18 29 / 0.9));
		box-shadow:
			0 1.5rem 4rem rgb(0 0 0 / 0.42),
			inset 0 1px 0 rgb(255 255 255 / 0.08);
	}

	.aurora {
		position: absolute;
		top: -4.5rem;
		right: -3rem;
		width: 13rem;
		height: 9rem;
		border-radius: 50%;
		background: linear-gradient(110deg, oklch(0.78 0.18 var(--hue) / 0.28), rgb(72 210 255 / 0.18));
		filter: blur(28px);
		pointer-events: none;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.22rem;
		height: 0.8rem;
		margin: -0.5rem 0 0.35rem;
		color: rgb(48 40 72 / 0.3);
	}

	.drag-handle span {
		width: 0.18rem;
		height: 0.18rem;
		border-radius: 50%;
		background: currentColor;
	}

	.drag-handle small {
		margin-left: 0.3rem;
		font-size: 0.52rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		opacity: 0;
		transition: opacity 150ms ease;
	}

	.music-player:hover .drag-handle small { opacity: 1; }
	:global(:root.dark) .drag-handle { color: rgb(255 255 255 / 0.25); }

	.player-main {
		position: relative;
		display: grid;
		grid-template-columns: 5.25rem minmax(0, 1fr);
		align-items: center;
		gap: 1rem;
	}

	.vinyl-shell {
		position: relative;
		display: grid;
		place-items: center;
		width: 5.25rem;
		height: 5.25rem;
		border-radius: 1.45rem;
		background: linear-gradient(145deg, oklch(0.72 0.18 var(--hue)), oklch(0.5 0.2 var(--hue)));
		box-shadow: 0 0.8rem 1.8rem oklch(0.48 0.14 var(--hue) / 0.3);
		overflow: hidden;
	}

	.vinyl-shell::before {
		position: absolute;
		inset: 0;
		background: linear-gradient(130deg, rgb(255 255 255 / 0.25), transparent 45%);
		content: "";
	}

	.vinyl {
		position: relative;
		width: 4.15rem;
		height: 4.15rem;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 50%;
		background:
			repeating-radial-gradient(circle, transparent 0 3px, rgb(255 255 255 / 0.08) 4px, transparent 5px),
			linear-gradient(135deg, #191724, #302945 48%, #15131f);
		box-shadow: 0 0.45rem 1rem rgb(20 14 34 / 0.42);
	}

	.playing .vinyl { animation: spin 7s linear infinite; }

	.vinyl-label {
		position: absolute;
		top: 50%;
		left: 50%;
		display: grid;
		place-items: center;
		width: 1.45rem;
		height: 1.45rem;
		border: 0.2rem solid rgb(255 255 255 / 0.22);
		border-radius: 50%;
		color: white;
		background: linear-gradient(145deg, oklch(0.75 0.17 var(--hue)), rgb(82 199 238));
		transform: translate(-50%, -50%);
	}

	.vinyl-label :global(svg) { font-size: 0.75rem; }
	.vinyl-groove { position: absolute; inset: 0.45rem; border: 1px solid rgb(255 255 255 / 0.1); border-radius: 50%; }
	.vinyl-groove.groove-two { inset: 0.9rem; }

	.tonearm {
		position: absolute;
		top: 0.6rem;
		right: 0.7rem;
		width: 0.18rem;
		height: 2.25rem;
		border-radius: 1rem;
		background: rgb(255 255 255 / 0.7);
		box-shadow: 0 0 0 0.18rem rgb(255 255 255 / 0.14);
		transform: rotate(-24deg);
		transform-origin: top;
		transition: transform 300ms ease;
	}

	.playing .tonearm { transform: rotate(-10deg); }

	.track-panel { min-width: 0; }
	.status-line { display: flex; align-items: center; gap: 0.35rem; color: oklch(0.55 0.17 var(--hue)); font-size: 0.54rem; font-weight: 800; letter-spacing: 0.12em; }
	.playing-dot { width: 0.38rem; height: 0.38rem; border-radius: 50%; background: currentColor; opacity: 0.4; }
	.playing-dot.active { opacity: 1; box-shadow: 0 0 0 0.2rem oklch(0.66 0.16 var(--hue) / 0.15); animation: pulse 1.5s ease-out infinite; }
	.track-count { margin-left: auto; color: rgb(45 38 65 / 0.33); letter-spacing: 0.05em; }
	.track-title { margin-top: 0.55rem; overflow: hidden; color: rgb(35 29 51 / 0.9); font-size: 0.95rem; font-weight: 750; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
	.track-artist { margin-top: 0.25rem; color: rgb(45 38 65 / 0.44); font-size: 0.68rem; }
	:global(:root.dark) .track-title { color: rgb(255 255 255 / 0.9); }
	:global(:root.dark) .track-artist, :global(:root.dark) .track-count { color: rgb(255 255 255 / 0.38); }

	.progress-wrap { margin-top: 0.75rem; }
	.progress, .volume-row input {
		width: 100%;
		height: 0.28rem;
		margin: 0;
		border-radius: 999px;
		outline: none;
		background: linear-gradient(to right, var(--primary) var(--progress), rgb(47 39 69 / 0.12) var(--progress));
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
	}

	.progress::-webkit-slider-thumb, .volume-row input::-webkit-slider-thumb {
		width: 0.72rem;
		height: 0.72rem;
		border: 2px solid white;
		border-radius: 50%;
		background: var(--primary);
		box-shadow: 0 0.15rem 0.5rem oklch(0.55 0.16 var(--hue) / 0.4);
		appearance: none;
		-webkit-appearance: none;
	}

	.progress::-moz-range-thumb, .volume-row input::-moz-range-thumb { width: 0.56rem; height: 0.56rem; border: 2px solid white; border-radius: 50%; background: var(--primary); }
	:global(:root.dark) .progress { background: linear-gradient(to right, var(--primary) var(--progress), rgb(255 255 255 / 0.13) var(--progress)); }
	.time-row { display: flex; justify-content: space-between; margin-top: 0.3rem; color: rgb(45 38 65 / 0.35); font-size: 0.58rem; font-variant-numeric: tabular-nums; }
	:global(:root.dark) .time-row { color: rgb(255 255 255 / 0.35); }

	.control-deck {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		margin-top: 0.8rem;
		padding: 0.48rem;
		border: 1px solid rgb(48 40 72 / 0.055);
		border-radius: 1rem;
		background: rgb(255 255 255 / 0.48);
	}

	:global(:root.dark) .control-deck { border-color: rgb(255 255 255 / 0.06); background: rgb(255 255 255 / 0.035); }

	.control-deck button {
		position: relative;
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: 0;
		border-radius: 50%;
		color: rgb(45 38 65 / 0.58);
		background: transparent;
		cursor: pointer;
		transition: color 150ms ease, background-color 150ms ease, transform 150ms ease;
	}

	.control-deck button:hover { color: var(--primary); background: oklch(0.82 0.08 var(--hue) / 0.25); }
	.control-deck button:active { transform: scale(0.88); }
	.control-deck button :global(svg) { font-size: 1.35rem; }
	.control-deck .play-button { width: 3rem; height: 3rem; margin: -0.3rem 0.15rem; color: white; background: linear-gradient(145deg, oklch(0.73 0.18 var(--hue)), oklch(0.56 0.21 var(--hue))); box-shadow: 0 0.5rem 1.15rem oklch(0.52 0.16 var(--hue) / 0.36); }
	.control-deck .play-button:hover { color: white; background: linear-gradient(145deg, oklch(0.78 0.18 var(--hue)), oklch(0.61 0.21 var(--hue))); }
	.control-deck .play-button :global(svg) { position: relative; z-index: 1; font-size: 1.75rem; }
	.play-halo { position: absolute; inset: -0.25rem; border: 1px solid oklch(0.65 0.18 var(--hue) / 0.25); border-radius: 50%; }
	.deck-divider { width: 1px; height: 1.5rem; margin: 0 0.2rem 0 0.45rem; background: rgb(45 38 65 / 0.1); }
	.list-button.active { color: var(--primary); background: oklch(0.82 0.08 var(--hue) / 0.3); }
	:global(:root.dark) .control-deck button { color: rgb(255 255 255 / 0.62); }
	:global(:root.dark) .deck-divider { background: rgb(255 255 255 / 0.1); }

	.expanded-content { max-height: 0; overflow: hidden; opacity: 0; transform: translateY(-0.5rem); transition: max-height 280ms ease, opacity 180ms ease, transform 280ms ease; }
	.expanded .expanded-content { max-height: 19rem; opacity: 1; transform: translateY(0); }
	.expanded-head { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0.3rem 0.45rem; padding-top: 0.8rem; border-top: 1px solid rgb(45 38 65 / 0.08); color: rgb(45 38 65 / 0.36); font-size: 0.56rem; font-weight: 800; letter-spacing: 0.14em; }
	:global(:root.dark) .expanded-head { border-color: rgb(255 255 255 / 0.08); color: rgb(255 255 255 / 0.36); }
	.volume-row { display: grid; grid-template-columns: 1rem 4.5rem; align-items: center; gap: 0.4rem; }
	.volume-row :global(svg) { font-size: 1rem; }
	.volume-row input { height: 0.22rem; background: linear-gradient(to right, var(--primary) var(--volume), rgb(45 38 65 / 0.12) var(--volume)); accent-color: var(--primary); }

	.playlist { display: grid; gap: 0.25rem; }
	.playlist button { display: grid; grid-template-columns: 1.7rem minmax(0, 1fr) 1.8rem; align-items: center; gap: 0.55rem; width: 100%; padding: 0.55rem 0.6rem; border: 1px solid transparent; border-radius: 0.9rem; color: rgb(45 38 65 / 0.68); background: transparent; text-align: left; cursor: pointer; transition: color 150ms ease, border-color 150ms ease, background-color 150ms ease, transform 150ms ease; }
	.playlist button:hover { transform: translateX(0.15rem); background: rgb(255 255 255 / 0.5); }
	.playlist button.active { border-color: oklch(0.68 0.14 var(--hue) / 0.16); color: var(--primary); background: oklch(0.88 0.05 var(--hue) / 0.38); }
	.track-number { display: grid; place-items: center; color: rgb(45 38 65 / 0.33); font-size: 0.62rem; font-weight: 700; font-variant-numeric: tabular-nums; }
	.playlist-copy { min-width: 0; }
	.playlist-copy strong, .playlist-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.playlist-copy strong { font-size: 0.72rem; font-weight: 700; }
	.playlist-copy small { margin-top: 0.15rem; color: rgb(45 38 65 / 0.38); font-size: 0.61rem; }
	.row-play { justify-self: end; color: rgb(45 38 65 / 0.27); font-size: 1.1rem; }
	:global(:root.dark) .playlist button { color: rgb(255 255 255 / 0.68); }
	:global(:root.dark) .playlist button:hover { background: rgb(255 255 255 / 0.05); }
	:global(:root.dark) .playlist button.active { background: oklch(0.42 0.07 var(--hue) / 0.28); }
	:global(:root.dark) .track-number, :global(:root.dark) .playlist-copy small, :global(:root.dark) .row-play { color: rgb(255 255 255 / 0.34); }

	.mini-wave { display: flex; align-items: center; gap: 0.1rem; height: 0.8rem; }
	.mini-wave i { width: 0.11rem; height: 0.35rem; border-radius: 1rem; background: var(--primary); animation: equalize 0.6s ease-in-out infinite alternate; }
	.mini-wave i:nth-child(2) { animation-delay: -0.25s; }
	.mini-wave i:nth-child(3) { animation-delay: -0.45s; }
	.error { margin: 0.45rem 0.6rem 0; color: #d34b5c; font-size: 0.68rem; }

	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes pulse { 70% { box-shadow: 0 0 0 0.5rem oklch(0.66 0.16 var(--hue) / 0); } 100% { box-shadow: 0 0 0 0 oklch(0.66 0.16 var(--hue) / 0); } }
	@keyframes equalize { from { height: 0.25rem; } to { height: 0.75rem; } }

	@media (max-width: 480px) {
		.music-player { right: 0.65rem; bottom: max(0.65rem, env(safe-area-inset-bottom)); width: calc(100vw - 1.3rem); padding: 0.8rem; border-radius: 1.4rem; }
		.player-main { grid-template-columns: 4.55rem minmax(0, 1fr); gap: 0.75rem; }
		.vinyl-shell { width: 4.55rem; height: 4.55rem; border-radius: 1.2rem; }
		.vinyl { width: 3.55rem; height: 3.55rem; }
		.track-title { font-size: 0.84rem; }
		.control-deck { margin-top: 0.65rem; }
	}

	@media (prefers-reduced-motion: reduce) {
		.music-player, .expanded-content, .control-deck button, .tonearm { transition: none; }
		.playing .vinyl, .playing-dot.active, .mini-wave i { animation: none; }
	}
</style>
