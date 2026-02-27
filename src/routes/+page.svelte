<script lang="ts">
	import { onMount } from 'svelte';
	import { MapLibre, GlobeControl, Projection, FillExtrusionLayer } from 'svelte-maplibre-gl';
	import { DeckGLOverlay } from '@svelte-maplibre-gl/deckgl';
	import { ArcLayer } from 'deck.gl';

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

	import type { StyleSpecification } from 'maplibre-gl';

	const CENTER: [number, number] = [139.7672, 35.6812];

	const emptyStyle: StyleSpecification = {
		version: 8,
		name: 'Empty Style',
		sources: {},
		layers: []
	};
</script>

<div class="map-container">
	<MapLibre class="map" style={emptyStyle} zoom={15} pitch={60} bearing={-45} center={CENTER}>
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
		{#if emptyStyle.sources && Object.keys(emptyStyle.sources).length > 0}
			<FillExtrusionLayer
				source="carto"
				sourceLayer="building"
				minzoom={14}
				paint={{
					'fill-extrusion-color': '#aaa',
					'fill-extrusion-height': [
						'interpolate',
						['linear'],
						['zoom'],
						14,
						0,
						14.05,
						['get', 'render_height']
					],
					'fill-extrusion-base': [
						'interpolate',
						['linear'],
						['zoom'],
						14,
						0,
						14.05,
						['get', 'render_min_height']
					],
					'fill-extrusion-opacity': 0.8
				}}
			/>
		{/if}
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
