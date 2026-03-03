/**
 * 地图主题颜色 Token 定义
 *
 * 每个主题只需定义一组颜色变量，公共图层模板会自动应用。
 * 新增主题：在 THEMES 中添加一条即可。
 */

// ─── 类型定义 ────────────────────────────────────────────

export interface SkyTokens {
	skyColor: string;
	horizonColor: string;
	fogColor: string;
	fogGroundBlend: number;
	horizonFogBlend: number;
	skyHorizonBlend: number;
	atmosphereBlend: number;
}

export interface ThemeTokens {
	name: string;
	description: string;

	// 基础
	background: string;

	// 水域
	water: string;
	waterway: string;

	// 地表覆盖
	landcoverGlacier: string;
	landcoverGlacierOpacity: number;
	landcoverWood: string;
	landcoverWoodOpacity: number;
	landcoverGrass: string;
	landcoverGrassOpacity: number;

	// 土地利用
	landuseResidential: string;
	landuseResidentialOpacity: number;
	landuseCommercial: string;
	landuseCommercialOpacity: number;
	landuseIndustrial: string;
	landuseIndustrialOpacity: number;
	park: string;
	parkOpacity: number;

	// 边界
	boundaryCountry: string;
	boundaryState: string;
	boundaryStateOpacity: number;

	// 道路（从主干到支路）
	roadMotorway: string;
	roadMotorwayOpacity: number;
	roadTrunk: string;
	roadTrunkOpacity: number;
	roadPrimary: string;
	roadPrimaryOpacity: number;
	roadSecondary: string;
	roadSecondaryOpacity: number;
	roadTertiary: string;
	roadTertiaryOpacity: number;
	roadStreet: string;
	roadStreetOpacity: number;
	rail: string;
	railOpacity: number;

	// 建筑（3D 拉伸颜色按 zoom 插值）
	buildingLow: string;
	buildingMid: string;
	buildingHigh: string;
	buildingGlowColor: string;
	buildingGlowBlur: number;
	buildingMaxOpacity: number;

	// 文本
	textPrimary: string; // 国家标签
	textSecondary: string; // 城市标签
	textTertiary: string; // 其他地点、道路、POI
	textHalo: string;

	// 天空（可选）
	sky?: SkyTokens;
}

// ─── 主题预设 ────────────────────────────────────────────

const blue: ThemeTokens = {
	name: 'TrunkInsight Blue Dashboard',
	description: '科技蓝主题地图 - 与 TrunkInsight 仪表盘 UI 配色协调',

	background: '#001529',
	water: '#00243d',
	waterway: '#00365a',

	landcoverGlacier: '#1a4a6a',
	landcoverGlacierOpacity: 0.5,
	landcoverWood: '#0a3a4a',
	landcoverWoodOpacity: 0.3,
	landcoverGrass: '#0a3545',
	landcoverGrassOpacity: 0.25,

	landuseResidential: '#002b5c',
	landuseResidentialOpacity: 0.4,
	landuseCommercial: '#003366',
	landuseCommercialOpacity: 0.35,
	landuseIndustrial: '#002952',
	landuseIndustrialOpacity: 0.35,
	park: '#0a4050',
	parkOpacity: 0.4,

	boundaryCountry: '#1890ff',
	boundaryState: '#4da6ff',
	boundaryStateOpacity: 0.5,

	roadMotorway: '#1890ff',
	roadMotorwayOpacity: 0.7,
	roadTrunk: '#40a9ff',
	roadTrunkOpacity: 0.65,
	roadPrimary: '#69c0ff',
	roadPrimaryOpacity: 0.6,
	roadSecondary: '#91d5ff',
	roadSecondaryOpacity: 0.5,
	roadTertiary: '#b5e3ff',
	roadTertiaryOpacity: 0.45,
	roadStreet: '#cceeff',
	roadStreetOpacity: 0.4,
	rail: '#5ab8ff',
	railOpacity: 0.4,

	buildingLow: '#002b5c',
	buildingMid: '#003d7a',
	buildingHigh: '#004d99',
	buildingGlowColor: '#1890ff',
	buildingGlowBlur: 0.5,
	buildingMaxOpacity: 0.85,

	textPrimary: '#40a9ff',
	textSecondary: '#69c0ff',
	textTertiary: '#b5e3ff',
	textHalo: '#001529'
};

const dark: ThemeTokens = {
	name: 'TrunkInsight Dark Globe',
	description: '基于 OpenFreeMap 的暗色地球样式，模拟 Mapbox Standard Dark 效果',

	background: '#1a1a2e',
	water: '#0d1b2a',
	waterway: '#0d1b2a',

	landcoverGlacier: '#2a2a4a',
	landcoverGlacierOpacity: 0.7,
	landcoverWood: '#1e3a1e',
	landcoverWoodOpacity: 0.4,
	landcoverGrass: '#1e3a1e',
	landcoverGrassOpacity: 0.3,

	landuseResidential: '#252538',
	landuseResidentialOpacity: 0.6,
	landuseCommercial: '#2a2a40',
	landuseCommercialOpacity: 0.5,
	landuseIndustrial: '#2a2535',
	landuseIndustrialOpacity: 0.5,
	park: '#1a3020',
	parkOpacity: 0.5,

	boundaryCountry: '#5a5a8a',
	boundaryState: '#5a5a8a',
	boundaryStateOpacity: 0.6,

	roadMotorway: '#4a3a5a',
	roadMotorwayOpacity: 1,
	roadTrunk: '#3a3a4a',
	roadTrunkOpacity: 1,
	roadPrimary: '#3a3a4a',
	roadPrimaryOpacity: 1,
	roadSecondary: '#2a2a3a',
	roadSecondaryOpacity: 1,
	roadTertiary: '#2a2a3a',
	roadTertiaryOpacity: 1,
	roadStreet: '#202030',
	roadStreetOpacity: 1,
	rail: '#4a4a5a',
	railOpacity: 1,

	buildingLow: '#1a1a2e',
	buildingMid: '#2a2a40',
	buildingHigh: '#3a3a55',
	buildingGlowColor: '#5a5a8a',
	buildingGlowBlur: 2,
	buildingMaxOpacity: 0.9,

	textPrimary: '#9a8aaa',
	textSecondary: '#9a8aaa',
	textTertiary: '#9a8aaa',
	textHalo: '#1a1a2e',

	sky: {
		skyColor: '#050510',
		horizonColor: '#1a3a6a',
		fogColor: '#0a0a1a',
		fogGroundBlend: 0.3,
		horizonFogBlend: 0.5,
		skyHorizonBlend: 0.3,
		atmosphereBlend: 1
	}
};

const light: ThemeTokens = {
	name: 'TrunkInsight Light',
	description: '基于 OpenFreeMap 的亮色地图样式',

	background: 'hsl(47, 26%, 88%)',
	water: 'hsl(205, 56%, 73%)',
	waterway: 'hsl(205, 56%, 73%)',

	landcoverGlacier: '#c8d8e8',
	landcoverGlacierOpacity: 0.5,
	landcoverWood: 'hsl(82, 46%, 72%)',
	landcoverWoodOpacity: 0.6,
	landcoverGrass: 'hsl(82, 46%, 72%)',
	landcoverGrassOpacity: 0.45,

	landuseResidential: 'hsl(47, 13%, 86%)',
	landuseResidentialOpacity: 0.7,
	landuseCommercial: 'hsl(47, 13%, 82%)',
	landuseCommercialOpacity: 0.5,
	landuseIndustrial: 'hsl(47, 13%, 80%)',
	landuseIndustrialOpacity: 0.5,
	park: 'rgba(192, 216, 151, 0.53)',
	parkOpacity: 1,

	boundaryCountry: 'hsla(0, 8%, 22%, 0.51)',
	boundaryState: 'hsla(0, 8%, 22%, 0.51)',
	boundaryStateOpacity: 0.6,

	roadMotorway: '#ffffff',
	roadMotorwayOpacity: 1,
	roadTrunk: '#ffffff',
	roadTrunkOpacity: 1,
	roadPrimary: '#ffffff',
	roadPrimaryOpacity: 1,
	roadSecondary: '#ffffff',
	roadSecondaryOpacity: 1,
	roadTertiary: '#ffffff',
	roadTertiaryOpacity: 1,
	roadStreet: '#f5f5f5',
	roadStreetOpacity: 1,
	rail: 'hsl(34, 12%, 66%)',
	railOpacity: 1,

	buildingLow: '#eaeaea',
	buildingMid: '#d6d6d6',
	buildingHigh: '#c0c0c0',
	buildingGlowColor: '#999999',
	buildingGlowBlur: 1,
	buildingMaxOpacity: 0.9,

	textPrimary: '#000000',
	textSecondary: '#000000',
	textTertiary: '#333333',
	textHalo: '#ffffff',

	sky: {
		skyColor: '#87ceeb',
		horizonColor: '#f0e6d3',
		fogColor: '#e8e4dc',
		fogGroundBlend: 0.2,
		horizonFogBlend: 0.3,
		skyHorizonBlend: 0.3,
		atmosphereBlend: 0.8
	}
};

// ─── 主题注册表 ──────────────────────────────────────────

export const THEMES: Record<string, ThemeTokens> = {
	Blue: blue,
	Dark: dark,
	Light: light
} as const;

/** 获取所有可用主题名称 */
export const THEME_NAMES = Object.keys(THEMES);
