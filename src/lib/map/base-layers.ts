/**
 * 公共图层模板
 *
 * 所有主题共享同一份图层结构，仅颜色从 ThemeTokens 读取。
 */

import type { LayerSpecification } from 'maplibre-gl';
import type { ThemeTokens } from '../theme-tokens';

/** 通用 text-field 表达式：优先本地语言，降级到拉丁语 */
const TEXT_FIELD_LOCAL = ['coalesce', ['get', 'name'], ['get', 'name:latin']];

export function createLayers(tokens: ThemeTokens): LayerSpecification[] {
	return [
		// ───────── 背景 ─────────
		{
			id: 'background',
			type: 'background',
			paint: {
				'background-color': tokens.background
			}
		},

		// ───────── 水域 ─────────
		{
			id: 'water',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'water',
			paint: {
				'fill-color': tokens.water,
				'fill-opacity': 1
			}
		},
		{
			id: 'waterway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'waterway',
			minzoom: 8,
			paint: {
				'line-color': tokens.waterway,
				'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 2]
			}
		},

		// ───────── 地表覆盖 ─────────
		{
			id: 'landcover-glacier',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			minzoom: 4,
			filter: ['==', ['get', 'class'], 'ice'],
			paint: {
				'fill-color': tokens.landcoverGlacier,
				'fill-opacity': tokens.landcoverGlacierOpacity
			}
		},
		{
			id: 'landcover-wood',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			minzoom: 4,
			filter: ['==', ['get', 'class'], 'wood'],
			paint: {
				'fill-color': tokens.landcoverWood,
				'fill-opacity': tokens.landcoverWoodOpacity
			}
		},
		{
			id: 'landcover-grass',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			minzoom: 4,
			filter: ['==', ['get', 'class'], 'grass'],
			paint: {
				'fill-color': tokens.landcoverGrass,
				'fill-opacity': tokens.landcoverGrassOpacity
			}
		},

		// ───────── 土地利用 ─────────
		{
			id: 'landuse-residential',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landuse',
			minzoom: 8,
			filter: ['==', ['get', 'class'], 'residential'],
			paint: {
				'fill-color': tokens.landuseResidential,
				'fill-opacity': tokens.landuseResidentialOpacity
			}
		},
		{
			id: 'landuse-commercial',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landuse',
			minzoom: 8,
			filter: ['==', ['get', 'class'], 'commercial'],
			paint: {
				'fill-color': tokens.landuseCommercial,
				'fill-opacity': tokens.landuseCommercialOpacity
			}
		},
		{
			id: 'landuse-industrial',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landuse',
			minzoom: 8,
			filter: ['==', ['get', 'class'], 'industrial'],
			paint: {
				'fill-color': tokens.landuseIndustrial,
				'fill-opacity': tokens.landuseIndustrialOpacity
			}
		},
		{
			id: 'park',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'park',
			minzoom: 10,
			paint: {
				'fill-color': tokens.park,
				'fill-opacity': tokens.parkOpacity
			}
		},

		// ───────── 边界 ─────────
		{
			id: 'boundary-country',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			filter: ['==', ['get', 'admin_level'], 2],
			paint: {
				'line-color': tokens.boundaryCountry,
				'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 5, 1.5, 10, 2],
				'line-opacity': 0.8
			}
		},
		{
			id: 'boundary-state',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			filter: ['==', ['get', 'admin_level'], 4],
			minzoom: 3,
			paint: {
				'line-color': tokens.boundaryState,
				'line-width': 0.8,
				'line-dasharray': [3, 2],
				'line-opacity': tokens.boundaryStateOpacity
			}
		},

		// ───────── 道路 ─────────
		{
			id: 'road-motorway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 5,
			filter: ['==', ['get', 'class'], 'motorway'],
			paint: {
				'line-color': tokens.roadMotorway,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.5, 12, 3, 18, 15],
				'line-opacity': tokens.roadMotorwayOpacity
			}
		},
		{
			id: 'road-trunk',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: ['==', ['get', 'class'], 'trunk'],
			paint: {
				'line-color': tokens.roadTrunk,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.3, 12, 2, 18, 10],
				'line-opacity': tokens.roadTrunkOpacity
			}
		},
		{
			id: 'road-primary',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 8,
			filter: ['==', ['get', 'class'], 'primary'],
			paint: {
				'line-color': tokens.roadPrimary,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 8, 0.5, 14, 2, 18, 8],
				'line-opacity': tokens.roadPrimaryOpacity
			}
		},
		{
			id: 'road-secondary',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 8,
			filter: ['==', ['get', 'class'], 'secondary'],
			paint: {
				'line-color': tokens.roadSecondary,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 8, 0.3, 14, 1.5, 18, 6],
				'line-opacity': tokens.roadSecondaryOpacity
			}
		},
		{
			id: 'road-tertiary',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 10,
			filter: ['==', ['get', 'class'], 'tertiary'],
			paint: {
				'line-color': tokens.roadTertiary,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 0.2, 14, 1, 18, 4],
				'line-opacity': tokens.roadTertiaryOpacity
			}
		},
		{
			id: 'road-street',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 12,
			filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
			paint: {
				'line-color': tokens.roadStreet,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.2, 16, 1, 18, 3],
				'line-opacity': tokens.roadStreetOpacity
			}
		},
		{
			id: 'rail',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 8,
			filter: ['==', ['get', 'class'], 'rail'],
			paint: {
				'line-color': tokens.rail,
				'line-width': 1,
				'line-dasharray': [4, 2],
				'line-opacity': tokens.railOpacity
			}
		},

		// ───────── 建筑 ─────────
		{
			id: 'building-3d',
			type: 'fill-extrusion',
			source: 'openmaptiles',
			'source-layer': 'building',
			minzoom: 14,
			paint: {
				'fill-extrusion-color': [
					'interpolate',
					['linear'],
					['zoom'],
					14,
					tokens.buildingLow,
					16,
					tokens.buildingMid,
					18,
					tokens.buildingHigh
				],
				'fill-extrusion-height': [
					'interpolate',
					['linear'],
					['zoom'],
					14,
					0,
					15,
					['*', ['get', 'render_height'], 0.5],
					16,
					['get', 'render_height']
				],
				'fill-extrusion-base': [
					'case',
					['>=', ['get', 'render_min_height'], 0],
					['get', 'render_min_height'],
					0
				],
				'fill-extrusion-opacity': [
					'interpolate',
					['linear'],
					['zoom'],
					14,
					0.5,
					16,
					tokens.buildingMaxOpacity
				],
				'fill-extrusion-vertical-gradient': true
			}
		},
		{
			id: 'building-glow',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'building',
			minzoom: 15,
			paint: {
				'line-color': tokens.buildingGlowColor,
				'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.3, 18, 1.2],
				'line-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0.2, 18, 0.5],
				'line-blur': tokens.buildingGlowBlur
			}
		},

		// ───────── 标签 ─────────
		{
			id: 'poi_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'poi',
			minzoom: 13,
			filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'rank'], 1]],
			layout: {
				'text-size': 12,
				'icon-image': ['get', 'class'],
				'text-offset': [0, 1.2],
				'text-anchor': 'top',
				'text-field': TEXT_FIELD_LOCAL,
				'icon-size': 1,
				'text-max-width': 8
			},
			paint: {
				'text-color': tokens.textTertiary,
				'text-halo-width': 1.5,
				'text-halo-color': tokens.textHalo
			}
		},
		{
			id: 'road_major_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			filter: ['==', ['geometry-type'], 'LineString'],
			layout: {
				'symbol-placement': 'line',
				'text-field': TEXT_FIELD_LOCAL,
				'text-letter-spacing': 0.1,
				'text-rotation-alignment': 'map',
				'text-size': {
					base: 1.4,
					stops: [
						[10, 8],
						[20, 14]
					]
				}
			},
			paint: {
				'text-color': tokens.textTertiary,
				'text-halo-color': tokens.textHalo,
				'text-halo-width': 1.5
			}
		},
		{
			id: 'place_label_other',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 8,
			filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['get', 'class'], 'city']],
			layout: {
				'text-anchor': 'center',
				'text-field': TEXT_FIELD_LOCAL,
				'text-max-width': 6,
				'text-size': {
					stops: [
						[6, 10],
						[12, 14]
					]
				},
				visibility: 'visible'
			},
			paint: {
				'text-color': tokens.textTertiary,
				'text-halo-color': tokens.textHalo,
				'text-halo-width': 2
			}
		},
		{
			id: 'place_label_city',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			maxzoom: 16,
			filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'class'], 'city']],
			layout: {
				'text-field': TEXT_FIELD_LOCAL,
				'text-max-width': 10,
				'text-size': {
					stops: [
						[3, 12],
						[8, 16]
					]
				}
			},
			paint: {
				'text-color': tokens.textSecondary,
				'text-halo-color': tokens.textHalo,
				'text-halo-width': 2
			}
		},
		{
			id: 'country_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			maxzoom: 12,
			filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'class'], 'country']],
			layout: {
				'text-field': TEXT_FIELD_LOCAL,
				'text-max-width': 10,
				'text-size': {
					stops: [
						[3, 12],
						[8, 22]
					]
				}
			},
			paint: {
				'text-color': tokens.textPrimary,
				'text-halo-color': tokens.textHalo,
				'text-halo-width': 2
			}
		}
	] as LayerSpecification[];
}
