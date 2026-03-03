/**
 * 地图样式构建器
 *
 * 将主题 Token + 公共图层模板组装为完整的 MapLibre StyleSpecification。
 */

import type { StyleSpecification } from 'maplibre-gl';
import { THEMES } from './theme-tokens';
import { createLayers } from './base-layers';

const DEFAULT_SPRITE = 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm';

const DEFAULT_SOURCES = {
	openmaptiles: {
		type: 'vector' as const,
		url: 'https://tiles.openfreemap.org/planet'
	}
};

/**
 * 根据主题名称构建完整的 MapLibre Style 对象
 *
 * @param themeName - 主题名称，需与 THEMES 中的 key 一致
 * @returns 可直接传给 MapLibre 的 StyleSpecification 对象
 * @throws 传入未注册的主题名称时抛错
 */
export function buildMapStyle(themeName: string): StyleSpecification {
	const tokens = THEMES[themeName];
	if (!tokens) {
		throw new Error(`未知主题: "${themeName}"。可用主题: ${Object.keys(THEMES).join(', ')}`);
	}

	const style: Record<string, unknown> = {
		version: 8,
		name: tokens.name,
		metadata: { description: tokens.description },
		center: [116.38, 39.9],
		zoom: 3,
		bearing: 0,
		pitch: 0,
		sprite: DEFAULT_SPRITE,
		sources: DEFAULT_SOURCES,
		layers: createLayers(tokens)
	};

	// 部分主题含 sky 配置
	if (tokens.sky) {
		style.sky = {
			'sky-color': tokens.sky.skyColor,
			'horizon-color': tokens.sky.horizonColor,
			'fog-color': tokens.sky.fogColor,
			'fog-ground-blend': tokens.sky.fogGroundBlend,
			'horizon-fog-blend': tokens.sky.horizonFogBlend,
			'sky-horizon-blend': tokens.sky.skyHorizonBlend,
			'atmosphere-blend': tokens.sky.atmosphereBlend
		};
	}

	return style as StyleSpecification;
}
