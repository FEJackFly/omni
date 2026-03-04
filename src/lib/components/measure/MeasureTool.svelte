<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { Map as MapLibreInstance } from 'maplibre-gl';
	import maplibregl from 'maplibre-gl';
	import length from '@turf/length';
	import area from '@turf/area';
	import {
		formatDistance,
		formatArea,
		buildLineGeoJSON,
		buildPolygonGeoJSON,
		buildPointsGeoJSON,
		getPolygonCentroid
	} from './measure.svelte.ts';

	interface Props {
		/** 地图实例 */
		map: MapLibreInstance | undefined;
		/** 测量模式：距离、面积或关闭 */
		mode: 'distance' | 'area' | null;
	}

	// ==================== 状态与属性 ====================

	let { map, mode }: Props = $props();

	/** 已采集的坐标点集合 */
	let points = $state<[number, number][]>([]);
	/** 用于跟随鼠标的临时坐标 */
	let cursorPos = $state<[number, number] | null>(null);
	/** 存储所有叠加在地图上的结果弹窗 */
	let popups = $state<maplibregl.Popup[]>([]);
	/** 是否已通过双击完成当前批次的测量 */
	let isFinished = $state(false);

	// 常量定义：数据源与图层 ID
	const SOURCE_ID = 'measure-source';
	const LINE_LAYER_ID = 'measure-line';
	const FILL_LAYER_ID = 'measure-fill';
	const POINT_LAYER_ID = 'measure-points';
	const PREVIEW_SOURCE_ID = 'measure-preview';
	const PREVIEW_LAYER_ID = 'measure-preview-line';

	// ==================== 响应式副作用 ====================

	/**
	 * 监听测量模式切换
	 * 使用 untrack 隔离内部状态修改逻辑，防止 points 等状态更新反向触发 setupLayers。
	 * 这样可以确保只有在 mode 或 map 基础对象改变时才重新初始化图层。
	 */
	$effect(() => {
		const currentMode = mode;
		const currentMap = map;

		untrack(() => {
			if (currentMode && currentMap) {
				reset();
				setupLayers();
				setCursor('crosshair');
			} else {
				cleanup();
			}
		});
	});

	// ==================== 工具函数 ====================

	/** 设置地图鼠标样式 */
	function setCursor(cursor: string) {
		if (map) map.getCanvas().style.cursor = cursor;
	}

	/** 重置测量相关状态 */
	function reset() {
		points = [];
		cursorPos = null;
		isFinished = false;
		removePopup();
	}

	/** 移除所有结果弹窗 */
	function removePopup() {
		popups.forEach((p) => p.remove());
		popups = [];
	}

	/** 初始化图层与交互事件绑定 */
	function setupLayers() {
		if (!map) return;
		removeLayers(); // 确保幂等性，先尝试移除旧图层

		try {
			// 添加主数据源（存放点、线、面要素）
			map.addSource(SOURCE_ID, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});

			// 添加预览数据源（存放随鼠标移动的预览线）
			map.addSource(PREVIEW_SOURCE_ID, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});

			// 1. 面积填充层
			map.addLayer({
				id: FILL_LAYER_ID,
				type: 'fill',
				source: SOURCE_ID,
				filter: ['==', '$type', 'Polygon'],
				paint: {
					'fill-color': '#f97316',
					'fill-opacity': 0.15
				}
			});

			// 2. 测量路径折线层
			map.addLayer({
				id: LINE_LAYER_ID,
				type: 'line',
				source: SOURCE_ID,
				filter: ['==', '$type', 'LineString'],
				paint: {
					'line-color': '#f97316',
					'line-width': 2.5
				}
			});

			// 3. 实时预览虚线层
			map.addLayer({
				id: PREVIEW_LAYER_ID,
				type: 'line',
				source: PREVIEW_SOURCE_ID,
				paint: {
					'line-color': '#f97316',
					'line-width': 1.5,
					'line-dasharray': [4, 4]
				}
			});

			// 4. 节点端点圆点层
			map.addLayer({
				id: POINT_LAYER_ID,
				type: 'circle',
				source: SOURCE_ID,
				filter: ['==', '$type', 'Point'],
				paint: {
					'circle-radius': 5,
					'circle-color': '#ffffff',
					'circle-stroke-color': '#f97316',
					'circle-stroke-width': 2
				}
			});

			// 绑定事件处理器
			map.on('click', handleClick);
			map.on('dblclick', handleDblClick);
			map.on('mousemove', handleMouseMove);
			document.addEventListener('keydown', handleKeyDown);
		} catch (e) {
			console.error('MeasureTool: 初始化图层异常', e);
		}
	}

	/** 彻底移除所有测绘图层与数据源 */
	function removeLayers() {
		if (!map) return;
		[POINT_LAYER_ID, PREVIEW_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach((id) => {
			if (map!.getLayer(id)) map!.removeLayer(id);
		});
		[SOURCE_ID, PREVIEW_SOURCE_ID].forEach((id) => {
			if (map!.getSource(id)) map!.removeSource(id);
		});
	}

	/** 停用测量工具并进行资源清理 */
	function cleanup() {
		if (map) {
			map.off('click', handleClick);
			map.off('dblclick', handleDblClick);
			map.off('mousemove', handleMouseMove);
			setCursor('');
		}
		document.removeEventListener('keydown', handleKeyDown);
		removeLayers();
		removePopup();
		// reset() 已经包含 points = [] 等清理，直接调用即可
		reset();
	}

	// ==================== 交互处理器 ====================

	/** 处理地图点击：增加测量节点 */
	function handleClick(e: maplibregl.MapMouseEvent) {
		if (!mode) return;

		// 如果当前批次已完成，再次点击则清空并开始新测量
		if (isFinished) {
			reset();
			setCursor('crosshair');
		}

		points = [...points, [e.lngLat.lng, e.lngLat.lat]];
		render();
	}

	/** 处理双击：结束当前测量 */
	function handleDblClick(e: maplibregl.MapMouseEvent) {
		if (!mode || points.length < 2) return;
		e.preventDefault();

		// 通常双击会多产生一个重复点，此处将其剔除
		if (points.length > 2) {
			points = points.slice(0, -1);
		}

		isFinished = true;
		cursorPos = null;
		setCursor('');
		render();
	}

	/** 实时更新鼠标跟随的预览线 */
	function handleMouseMove(e: maplibregl.MapMouseEvent) {
		if (isFinished || !mode || points.length === 0) return;
		cursorPos = [e.lngLat.lng, e.lngLat.lat];
		renderPreview();
	}

	/** 键盘监听：ESC 退出测量 */
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') cleanup();
	}

	// ==================== 渲染核心 ====================

	/** 触发全量图层与弹窗渲染更新 */
	function render() {
		renderGeoJSON();
		renderPreview();
		renderResult();
	}

	/** 更新主数据源（绘制节点、主体线条及面） */
	function renderGeoJSON() {
		if (!map) return;
		const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
		if (!source) return;

		const features: GeoJSON.Feature[] = [];

		try {
			// 1. 生成所有节点要素
			const pointsGJ = buildPointsGeoJSON(points);
			features.push(...pointsGJ.features);

			// 2. 生成连线要素
			let lineGJ = buildLineGeoJSON(points);

			// 测面模式：如果是最后一步或已点出多个点，应显示闭合轮廓线
			if (mode === 'area' && points.length >= 3) {
				lineGJ = buildLineGeoJSON([...points, points[0]]);
			}

			if (lineGJ) features.push(lineGJ);

			// 3. 测面模式下生成多边形要素
			if (mode === 'area') {
				const polyGJ = buildPolygonGeoJSON(points);
				if (polyGJ) features.push(polyGJ);
			}

			source.setData({ type: 'FeatureCollection', features });
		} catch (e) {
			console.error('MeasureTool: 更新 GeoJSON 数据源异常', e);
		}
	}

	/** 更新移动预览线数据源 */
	function renderPreview() {
		if (!map) return;
		const source = map.getSource(PREVIEW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
		if (!source) return;

		const emptyData: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

		// 不需要渲染预览的情况：没有跟随位置、没有起始点或测绘已结束
		if (!cursorPos || points.length === 0 || isFinished) {
			source.setData(emptyData);
			return;
		}

		// 测面模式：预览线需同时连接最后一个点和第一个点，形成封闭感
		if (mode === 'area' && points.length >= 2) {
			const lineGJ = buildLineGeoJSON([...points, cursorPos, points[0]]);
			source.setData(lineGJ ? { type: 'FeatureCollection', features: [lineGJ] } : emptyData);
		} else {
			// 测距模式：仅连接最后一个点和预览点
			const lastPoint = points[points.length - 1];
			const lineGJ = buildLineGeoJSON([lastPoint, cursorPos]);
			source.setData(lineGJ ? { type: 'FeatureCollection', features: [lineGJ] } : emptyData);
		}
	}

	/** 计算测量数值并通过 Popup 实时展示结果信息 */
	function renderResult() {
		if (!map || points.length === 0) {
			removePopup();
			return;
		}

		// 每次渲染前清理旧的 Popup，或者进行增量更新（此处选择全量清理以保证逻辑简单且正确）
		removePopup();

		if (mode === 'distance') {
			// 测距模式：每个点都显示累计距离
			let accumulatedDist = 0;
			points.forEach((currentPoint, index) => {
				let text = '';
				if (index === 0) {
					text = '起点';
				} else {
					const segment = buildLineGeoJSON(points.slice(0, index + 1));
					if (segment) {
						accumulatedDist = length(segment, { units: 'meters' });
						text = formatDistance(accumulatedDist);
					}
				}

				if (text) {
					const p = createPopup(currentPoint, text);
					popups.push(p);
				}
			});
		} else if (mode === 'area') {
			// 测面模式：面积显示在中心点
			if (points.length === 1) {
				const p = createPopup(points[0], '起点');
				popups.push(p);
			} else if (points.length === 2) {
				// 前两个点显示距离
				const lineGJ = buildLineGeoJSON(points);
				if (lineGJ) {
					const dist = length(lineGJ, { units: 'meters' });
					const p = createPopup(points[1], formatDistance(dist));
					popups.push(p);
				}
			} else if (points.length >= 3) {
				// 三点及以上计算面积并显示在正中间
				const polyGJ = buildPolygonGeoJSON(points);
				if (polyGJ) {
					const areaVal = area(polyGJ);
					const center = getPolygonCentroid(points);
					if (center) {
						const p = createPopup(center, formatArea(areaVal));
						popups.push(p);
					}
				}
			}
		}
	}

	/** 创建并返回一个新的 Popup 实例 */
	function createPopup(lngLat: [number, number], text: string): maplibregl.Popup {
		return new maplibregl.Popup({
			closeButton: false,
			closeOnClick: false,
			anchor: 'bottom',
			offset: [0, 0], // 移除箭头后无需大的负值偏移
			className: 'measure-popup'
		})
			.setLngLat(lngLat)
			.setHTML(`<div class="measure-result">${text}</div>`)
			.addTo(map!);
	}

	// 组件挂载与卸载处理
	onMount(() => {
		return () => cleanup();
	});
</script>

<style>
	/* 应用于测量结果弹窗的全局样式覆盖 */
	:global(.measure-popup .maplibregl-popup-content) {
		background: var(--ui-surface, rgba(10, 18, 36, 0.9));
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(249, 115, 22, 0.4);
		border-radius: 6px;
		padding: 6px 12px;
		color: #ffffff;
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 13px;
		font-weight: 600;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		pointer-events: none; /* 弹窗不遮挡点击 */
	}

	:global(.measure-popup .maplibregl-popup-tip) {
		display: none; /* 移除讨厌的小箭头 */
	}

	/* 内部容器微调 */
	:global(.measure-result) {
		display: flex;
		align-items: center;
		white-space: nowrap;
	}
</style>
