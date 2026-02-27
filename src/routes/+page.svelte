<script lang="ts">
	import { MapLibre, CustomLayer, GlobeControl, Projection } from 'svelte-maplibre-gl';

	const CENTER: [number, number] = [139.7672, 35.6812];

	const emptyStyle = {
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
