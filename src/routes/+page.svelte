<script lang="ts">
	import { onMount } from 'svelte';
	import { MapLibre, GlobeControl, Projection, FillExtrusionLayer } from 'svelte-maplibre-gl';
	import { DeckGLOverlay } from '@svelte-maplibre-gl/deckgl';
	import { ArcLayer } from 'deck.gl';
	import type { StyleSpecification } from 'maplibre-gl';
	import { buildMapStyle, THEME_NAMES } from '$lib/map';

	const NUM = 30;
	let data: { source: [number, number]; target: [number, number] }[] = $state([]);

	onMount(() => {
		let handle = requestAnimationFrame(function updateFrame(t) {
			data = Array.from({ length: NUM }, (_, i) => {
				const O = (2 * Math.PI) / NUM;
				const r = (1.3 + Math.sin(t / 510 + i * O)) * 0.002;
				return {
					source: [139.7672, 35.6812],
					target: [
						139.7672 + Math.cos(t / 730 + i * O) * r,
						35.6812 + Math.sin(t / 730 + i * O) * r
					]
				};
			});
			handle = requestAnimationFrame(updateFrame);
		});
		return () => cancelAnimationFrame(handle);
	});

	const CENTER: [number, number] = [139.7672, 35.6812];

	/** 可选主题：动态构建 + Satellite（独立 JSON） */
	const ALL_THEMES = [...THEME_NAMES, 'Satellite'];
	const SATELLITE_STYLE_URL = '/map_styles/satellite.json';

	let currentThemeKey = $state('Blue');

	/** Blue/Dark/Light 由构建器生成对象，Satellite 走 JSON URL */
	let currentStyle: StyleSpecification | string = $derived(
		currentThemeKey === 'Satellite' ? SATELLITE_STYLE_URL : buildMapStyle(currentThemeKey)
	);
</script>

<div class="map-container">
	<div class="theme-selector">
		<label for="theme-select">选择主题：</label>
		<select id="theme-select" bind:value={currentThemeKey}>
			{#each ALL_THEMES as key}
				<option value={key}>{key}</option>
			{/each}
		</select>
	</div>
	<MapLibre
		class="map"
		style={currentStyle}
		zoom={15}
		pitch={0}
		bearing={-45}
		center={CENTER}
		maxPitch={80}
	>
		<GlobeControl />
		<Projection />

		<DeckGLOverlay
			interleaved
			layers={[
				new ArcLayer({
					id: 'deckgl-arc',
					data,
					getSourcePosition: (d) => d.source,
					getTargetPosition: (d) => d.target,
					getSourceColor: [0, 255, 100],
					getTargetColor: [0, 190, 255],
					getWidth: 5
				})
			]}
		/>
	</MapLibre>
</div>

<style>
	.map-container {
		position: relative;
		width: 100%;
		height: 100vh;
	}

	.map-container :global(.map) {
		width: 100%;
		height: 100%;
	}

	.theme-selector {
		position: absolute;
		top: 20px;
		left: 20px;
		z-index: 10;
		background: rgba(255, 255, 255, 0.9);
		padding: 10px 16px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: sans-serif;
		backdrop-filter: blur(4px);
	}

	.theme-selector select {
		padding: 6px;
		border-radius: 4px;
		border: 1px solid #ddd;
		outline: none;
		cursor: pointer;
	}
</style>
