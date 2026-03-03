<script lang="ts">
	import { onMount } from 'svelte';
	import { MapLibre, GlobeControl, Projection, FillExtrusionLayer } from 'svelte-maplibre-gl';
	import { DeckGLOverlay } from '@svelte-maplibre-gl/deckgl';
	import { ArcLayer } from 'deck.gl';
	import type { StyleSpecification } from 'maplibre-gl';
	import { buildMapStyle, THEME_NAMES } from '$lib/map';
	import MapToolbar from '$lib/components/toolbar/MapToolbar.svelte';

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

	let mapState = $state({
		zoom: 15,
		pitch: 0,
		bearing: -45,
		center: [139.7672, 35.6812] as [number, number],
		maxPitch: 80
	});

	/** 可选主题：动态构建 + Satellite（独立 JSON） */
	const ALL_THEMES = [...THEME_NAMES, 'Satellite'];
	const SATELLITE_STYLE_URL = '/map_styles/satellite.json';

	let currentThemeKey = $state('Blue');

	/** Blue/Dark/Light 由构建器生成对象，Satellite 走 JSON URL */
	let currentStyle: StyleSpecification | string = $derived(
		currentThemeKey === 'Satellite' ? SATELLITE_STYLE_URL : buildMapStyle(currentThemeKey)
	);

	let currentView = $state<'2d' | '3d'>('2d');

	/** 视图切换回调 */
	function handleViewChange(view: '2d' | '3d') {
		currentView = view;
		mapState.pitch = view === '3d' ? 60 : 0;
	}

	/** 主题切换回调 */
	function handleThemeChange(theme: string) {
		currentThemeKey = theme;
	}
</script>

<div class="map-container">
	<MapToolbar
		themes={ALL_THEMES}
		currentTheme={currentThemeKey}
		{currentView}
		onthemechange={handleThemeChange}
		onviewchange={handleViewChange}
	/>
	<MapLibre class="map" style={currentStyle} {...mapState}>
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
</style>
