<script lang="ts">
	interface Props {
		themes: string[];
		current: string;
		onselect: (theme: string) => void;
	}

	let { themes, current, onselect }: Props = $props();

	const THEME_COLORS: Record<string, string> = {
		Blue: '#1890ff',
		Dark: '#2a2a40',
		Light: '#f0e6d3',
		Satellite: '#4a7a3a'
	};
</script>

<div class="theme-panel">
	{#each themes as theme}
		<button class="theme-item" class:active={current === theme} onclick={() => onselect(theme)}>
			<span class="color-dot" style:background={THEME_COLORS[theme] ?? '#888'}></span>
			<span class="name">{theme}</span>
		</button>
	{/each}
</div>

<style>
	.theme-panel {
		background: var(--ui-surface);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--ui-border);
		border-radius: 10px;
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		min-width: 110px;
	}

	.theme-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--ui-text);
		font-size: 12px;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.theme-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--ui-text-hover);
	}

	[data-theme='Light'] .theme-item:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.theme-item.active {
		background: var(--ui-active-bg);
		color: var(--ui-accent);
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.15);
		flex-shrink: 0;
	}

	.theme-item.active .color-dot {
		border-color: #1890ff;
	}
</style>
