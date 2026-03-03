<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="toolbar-group">
	{@render children()}
</div>

<style>
	.toolbar-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px 0;
	}

	.toolbar-group:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
</style>
