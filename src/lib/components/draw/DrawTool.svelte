<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { Map as MapLibreInstance } from 'maplibre-gl';
	import {
		buildLineGeoJSON,
		buildPolygonGeoJSON,
		buildPointsGeoJSON
	} from '../measure/measure.svelte.ts';

	interface Props {
		/** 地图实例 */
		map: MapLibreInstance | undefined;
		/** 当前启用的绘图模式：'point' | 'line' | 'polygon' 或 null（关闭绘制） */
		mode: 'point' | 'line' | 'polygon' | null;
	}

	// ==================== 状态组件属性 ====================

	let { map, mode }: Props = $props();

	/** 存储历史已闭合完成的 GeoJSON 要素列表 */
	let allFeatures = $state<GeoJSON.Feature[]>([]);
	/** 当前鼠标左键正在持续采集的地理坐标点序列 */
	let currentPoints = $state<[number, number][]>([]);
	/** 鼠标在移动时随时捕获的临时坐标，用于生成实时的预览虚线框或段 */
	let cursorPos = $state<[number, number] | null>(null);

	// MapLibre 的源和图层常量定义
	const SOURCE_ID = 'draw-source';
	const LINE_LAYER_ID = 'draw-line';
	const FILL_LAYER_ID = 'draw-fill';
	const POINT_LAYER_ID = 'draw-points';
	const PREVIEW_SOURCE_ID = 'draw-preview';
	const PREVIEW_LAYER_ID = 'draw-preview-line';

	// ==================== 生命周期及核心联动 ====================

	$effect(() => {
		// 提炼当前依赖
		const currentMode = mode;
		const currentMap = map;

		untrack(() => {
			if (currentMode && currentMap) {
				setupLayers();
				setCursor('crosshair'); // 启用绘制时替换标准光标为十字
			} else {
				cleanup(); // 关闭或实例不存在时释放资源
			}
		});
	});

	// ==================== 基础功能与地图图层挂载 ====================

	/** 更改地图的默认鼠标光标样式 */
	function setCursor(cursor: string) {
		if (map) map.getCanvas().style.cursor = cursor;
	}

	/** 重置当前还在途的绘制缓存，不影响已存在的静态要素 */
	function resetCurrent() {
		currentPoints = [];
		cursorPos = null;
	}

	/** 核心图层准备阶段，注册各类图形和临时渲染线条层 */
	function setupLayers() {
		if (!map) return;
		// 每次初始化前先卸载之前的残留
		removeLayers();

		try {
			// 主要素源：包含所有的点、线、多边形数据
			map.addSource(SOURCE_ID, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});

			// 预览数据源：专用来展示未完成绘制过程中的游标路径
			map.addSource(PREVIEW_SOURCE_ID, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});

			// 渲染多边形填充颜色区域
			map.addLayer({
				id: FILL_LAYER_ID,
				type: 'fill',
				source: SOURCE_ID,
				filter: ['==', '$type', 'Polygon'],
				paint: {
					'fill-color': '#3b82f6',
					'fill-opacity': 0.2
				}
			});

			// 渲染连续点形成的线条外框
			map.addLayer({
				id: LINE_LAYER_ID,
				type: 'line',
				source: SOURCE_ID,
				filter: ['==', '$type', 'LineString'],
				paint: {
					'line-color': '#3b82f6',
					'line-width': 3
				}
			});

			// 用于呈现鼠标游走时的辅助连接虚线
			map.addLayer({
				id: PREVIEW_LAYER_ID,
				type: 'line',
				source: PREVIEW_SOURCE_ID,
				paint: {
					'line-color': '#3b82f6',
					'line-width': 2,
					'line-dasharray': [2, 2] // 短划虚线效果
				}
			});

			// 基础点位可视化渲染
			map.addLayer({
				id: POINT_LAYER_ID,
				type: 'circle',
				source: SOURCE_ID,
				filter: ['==', '$type', 'Point'],
				paint: {
					'circle-radius': 6,
					'circle-color': '#ffffff',
					'circle-stroke-color': '#3b82f6',
					'circle-stroke-width': 2
				}
			});

			// 挂载原生地图鼠标与事件响应
			map.on('click', handleClick);
			map.on('dblclick', handleDblClick);
			map.on('mousemove', handleMouseMove);
			document.addEventListener('keydown', handleKeyDown);

			// 初次启动立刻刷新视口渲染（应对组件切换时恢复先前的绘图痕迹）
			render();
		} catch (e) {
			console.error('DrawTool: 挂载图层过程失败', e);
		}
	}

	/** 按指定常量表进行资源卸载安全清空 */
	function removeLayers() {
		if (!map) return;
		[POINT_LAYER_ID, PREVIEW_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach((id) => {
			if (map!.getLayer(id)) map!.removeLayer(id);
		});
		[SOURCE_ID, PREVIEW_SOURCE_ID].forEach((id) => {
			if (map!.getSource(id)) map!.removeSource(id);
		});
	}

	/** 回收所有全局状态监听和图层绑定 */
	function cleanup() {
		if (map) {
			map.off('click', handleClick);
			map.off('dblclick', handleDblClick);
			map.off('mousemove', handleMouseMove);
			setCursor('');
		}
		document.removeEventListener('keydown', handleKeyDown);
		removeLayers();
		resetCurrent();
		allFeatures = []; // 清理全局遗留历史集合
	}

	// ==================== 地图端核心鼠标动作分发 ====================

	/** 左键单次按压将当前地理坐标注入序列并请求局部重绘 */
	function handleClick(e: maplibregl.MapMouseEvent) {
		if (!mode) return;

		const pos: [number, number] = [e.lngLat.lng, e.lngLat.lat];

		if (mode === 'point') {
			// 单点模式下立即持久化
			const feature: GeoJSON.Feature = {
				type: 'Feature',
				geometry: { type: 'Point', coordinates: pos },
				properties: {}
			};
			allFeatures = [...allFeatures, feature];
		} else {
			// 连线或面模式将节点添加进队列
			currentPoints = [...currentPoints, pos];
		}
		render();
	}

	/** 连续快速触发鼠标左右键判定为结束当前线/面节点收集 */
	function handleDblClick(e: maplibregl.MapMouseEvent) {
		if (!mode || mode === 'point' || currentPoints.length < 2) return;
		e.preventDefault(); // 阻断默认的双击放大地图动作机制

		// 有时原生地图的双击会触发两次点击，将最后额外的坐标丢弃
		const finalPoints = currentPoints.length > 2 ? currentPoints.slice(0, -1) : currentPoints;

		if (mode === 'line') {
			allFeatures = [
				...allFeatures,
				{
					type: 'Feature',
					geometry: { type: 'LineString', coordinates: finalPoints },
					properties: {}
				}
			];
		} else if (mode === 'polygon' && finalPoints.length >= 3) {
			// 构成几何多边形必须要在开头和结尾通过同一坐标串联闭合
			allFeatures = [
				...allFeatures,
				{
					type: 'Feature',
					geometry: { type: 'Polygon', coordinates: [[...finalPoints, finalPoints[0]]] },
					properties: {}
				}
			];
		}

		resetCurrent(); // 结束此轮收集
		render();
	}

	/** 捕获持续的游标跟随 */
	function handleMouseMove(e: maplibregl.MapMouseEvent) {
		// 单点放置没有辅助游标线需求
		if (!mode || mode === 'point' || currentPoints.length === 0) return;
		cursorPos = [e.lngLat.lng, e.lngLat.lat];
		renderPreview();
	}

	/** 拦截 ESC 按键实现紧急终止或后退等动作（当前作为直接全盘卸载释放） */
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') cleanup();
	}

	// ==================== 高频 UI 数据渲染引擎 ====================

	/** 执行全量及预览层的同步渲染更新 */
	function render() {
		renderGeoJSON();
		renderPreview();
	}

	/** 将固定及在途的状态重组为 Maplibre 认识的标准集合装载进数据源 */
	function renderGeoJSON() {
		if (!map) return;
		const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
		if (!source) return;

		const activeFeatures: GeoJSON.Feature[] = [];

		// 附加正在生成的关联区域和结构
		if (mode === 'line' && currentPoints.length >= 2) {
			const line = buildLineGeoJSON(currentPoints);
			if (line) activeFeatures.push(line);
		} else if (mode === 'polygon' && currentPoints.length >= 3) {
			const poly = buildPolygonGeoJSON(currentPoints);
			if (poly) activeFeatures.push(poly);
			// 生成的面通常还需要有一道包裹外边缘强调勾勒线
			const line = buildLineGeoJSON(currentPoints);
			if (line) activeFeatures.push(line);
		}

		// 追加单独的点集到视图上供感知
		if (currentPoints.length > 0) {
			activeFeatures.push(...buildPointsGeoJSON(currentPoints).features);
		}

		// 推送并全覆盖现有的源底层对象数据
		source.setData({
			type: 'FeatureCollection',
			features: [...allFeatures, ...activeFeatures]
		});
	}

	/** 以极低的成本将动态的鼠标节点加入，避免污染源图层级 */
	function renderPreview() {
		if (!map) return;
		const source = map.getSource(PREVIEW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
		if (!source) return;

		// 当无点基础或越界时，停止空绘
		if (!cursorPos || currentPoints.length === 0) {
			source.setData({ type: 'FeatureCollection', features: [] });
			return;
		}

		if (mode === 'line') {
			// 在末尾点与鼠标中连接即可
			const lineGJ = buildLineGeoJSON([currentPoints[currentPoints.length - 1], cursorPos]);
			if (lineGJ) source.setData({ type: 'FeatureCollection', features: [lineGJ] });
		} else if (mode === 'polygon') {
			// 与首尾一起形成个半闭环引导结构
			const lineGJ = buildLineGeoJSON([
				currentPoints[currentPoints.length - 1],
				cursorPos,
				currentPoints[0]
			]);
			if (lineGJ) source.setData({ type: 'FeatureCollection', features: [lineGJ] });
		}
	}

	onMount(() => {
		// 销毁并断开绑定关联
		return () => cleanup();
	});
</script>
