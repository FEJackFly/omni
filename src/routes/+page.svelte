<script lang="ts">
	import { onMount } from 'svelte';
	import { MapLibre, Projection, FillExtrusionLayer, ScaleControl } from 'svelte-maplibre-gl';
	import { DeckGLOverlay } from '@svelte-maplibre-gl/deckgl';
	import { ArcLayer } from 'deck.gl';
	import type { StyleSpecification, Map as MapLibreInstance } from 'maplibre-gl';
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
		pitch: 70,
		bearing: -45,
		center: [121.5054, 31.2335] as [number, number],
		maxPitch: 80
	});

	/** 可选主题：动态构建 + Satellite（独立 JSON） */
	const ALL_THEMES = [...THEME_NAMES, 'Satellite'];
	const SATELLITE_STYLE_URL = '/map_styles/satellite.json';

	let currentThemeKey = $state('Blue');
	let projection = $state<'mercator' | 'globe'>('mercator');

	/** Blue/Dark/Light 由构建器生成对象，Satellite 走 JSON URL */
	let currentStyle: StyleSpecification | string = $derived(
		currentThemeKey === 'Satellite' ? SATELLITE_STYLE_URL : buildMapStyle(currentThemeKey)
	);

	let currentView = $state<'2d' | '3d'>('2d');
	let map: MapLibreInstance | undefined = $state();
	let mousePos = $state<{ lng: number; lat: number } | null>(null);

	/** 视图切换回调 */
	function handleViewChange(view: '2d' | '3d') {
		currentView = view;
		mapState.pitch = view === '3d' ? 60 : 0;
	}

	/** 主题切换回调 */
	function handleThemeChange(theme: string) {
		currentThemeKey = theme;
	}

	/** 投影切换回调 */
	function handleProjectionChange(p: 'mercator' | 'globe') {
		projection = p;
	}

	/** 鼠标移动监听 */
	function handleMouseMove(e: { lngLat: { lng: number; lat: number } }) {
		mousePos = e.lngLat;
	}

	/** 缩放回调 */
	function handleZoomChange(delta: number) {
		if (map) {
			map.zoomTo(map.getZoom() + delta, { duration: 300 });
		} else {
			mapState.zoom = Math.max(0, Math.min(22, mapState.zoom + delta));
		}
	}

	/** 指南针重置 */
	function handleBearingReset() {
		if (map) {
			map.resetNorth();
		} else {
			mapState.bearing = 0;
		}
	}

	/** 同步主题到全局 HTML 属性 */
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = currentThemeKey;
		}
	});
</script>

<div class="map-container">
	<MapLibre
		bind:map
		class="map"
		style={currentStyle}
		bind:zoom={mapState.zoom}
		bind:pitch={mapState.pitch}
		bind:bearing={mapState.bearing}
		bind:center={mapState.center}
		maxPitch={mapState.maxPitch}
		attributionControl={false}
		onmousemove={handleMouseMove}
	>
		<MapToolbar
			themes={ALL_THEMES}
			currentTheme={currentThemeKey}
			{currentView}
			{projection}
			bearing={mapState.bearing}
			onthemechange={handleThemeChange}
			onviewchange={handleViewChange}
			onprojectionchange={handleProjectionChange}
			onzoomchange={handleZoomChange}
			onbearingreset={handleBearingReset}
		/>
		<Projection type={projection} />
		<ScaleControl position="bottom-left" unit="metric" />

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

	<!-- 左下角信息面板：比例尺与鼠标位置 -->
	{#if mousePos}
		<div class="info-panel bottom-left">
			<!-- 比例尺会由 MapLibre 自动定位到这里 -->
			<div class="scale-placeholder"></div>

			<div class="info-group">
				<div class="info-item">
					<span class="label">LNG</span>
					<span class="value">{mousePos.lng.toFixed(6)}</span>
				</div>
				<div class="info-item">
					<span class="label">LAT</span>
					<span class="value">{mousePos.lat.toFixed(6)}</span>
				</div>
			</div>
		</div>
	{/if}
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

	/* 隐藏右下角 MapLibre 标志 */
	.map-container :global(.maplibregl-ctrl-logo) {
		display: none !important;
	}

	/** 底部统一信息底栏 */
	.info-panel {
		position: absolute;
		bottom: 24px;
		left: 20px;
		display: flex;
		align-items: center;
		height: 32px;
		background: var(--ui-surface);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--ui-border);
		padding: 0 12px;
		border-radius: 6px;
		gap: 20px;
		pointer-events: none;
		font-family: 'JetBrains Mono', 'Monaco', monospace;
		font-size: 11px;
		color: var(--ui-text);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		z-index: 50;
	}

	/** 比例尺容器占位 */
	.scale-placeholder {
		min-width: 60px;
		height: 100%;
		display: flex;
		align-items: center;
		position: relative;
	}

	.info-group {
		display: flex;
		gap: 16px;
		padding-left: 16px;
		border-left: 1px solid var(--ui-border);
		height: 14px;
		align-items: center;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.label {
		opacity: 0.5;
		font-weight: 600;
	}

	.value {
		min-width: 75px;
	}

	/* 深度定制内置比例尺样式，使其融入底栏 */
	.map-container :global(.maplibregl-ctrl-scale) {
		background: transparent !important;
		border: none !important;
		border-bottom: 2px solid var(--ui-text) !important;
		border-left: 2px solid var(--ui-text) !important;
		border-right: 2px solid var(--ui-text) !important;
		color: var(--ui-text) !important;
		border-radius: 0 !important;
		margin: 0 !important;
		padding: 0 5px !important;
		font-size: 11px !important;
		font-weight: 600 !important;
		white-space: nowrap !important;
		z-index: 60 !important;
	}

	.map-container :global(.maplibregl-ctrl-bottom-left) {
		left: 32px !important;
		bottom: 30px !important;
		pointer-events: none !important;
		z-index: 60 !important;
	}
</style>
