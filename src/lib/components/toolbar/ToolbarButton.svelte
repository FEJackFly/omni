<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		active?: boolean;
		onclick?: () => void;
		children: Snippet;
	}

	let { label, active = false, onclick, children }: Props = $props();
</script>

<button class="toolbar-btn" class:active title={label} {onclick} aria-label={label}>
	{@render children()}
</button>

<style>
	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--ui-text);
		cursor: pointer;
		transition: all 0.2s ease;
		outline: none;
		padding: 0;
	}

	.toolbar-btn :global(svg) {
		width: 18px;
		height: 18px;
		stroke: currentColor;
		fill: none;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.toolbar-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--ui-text-hover);
	}

	[data-theme='Light'] .toolbar-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.toolbar-btn.active {
		background: var(--ui-active-bg);
		color: var(--ui-accent);
	}
</style>
