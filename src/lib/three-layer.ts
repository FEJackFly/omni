import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import maplibregl from 'maplibre-gl';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 模型配置 */
export interface ModelConfig {
	/** 唯一标识 */
	id: string;
	/** 经纬度 [lng, lat] */
	lngLat: [number, number];
	/** 海拔（米），默认 0 */
	altitude?: number;
	/** GLTF / GLB 模型地址（与 object 二选一） */
	url?: string;
	/** 直接传入 Three.js 对象（与 url 二选一） */
	object?: THREE.Object3D;
	/** 整体缩放系数，默认 1 */
	scale?: number;
	/** 旋转 [x, y, z] 弧度，默认 [0, 0, 0] */
	rotation?: [number, number, number];
}

/** 内部跟踪条目 */
interface ModelEntry {
	config: ModelConfig;
	group: THREE.Group;
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 计算目标经纬度相对于场景原点的米制偏移量（东向、北向）
 */
function lngLatToMeterOffset(
	originLngLat: [number, number],
	targetLngLat: [number, number]
): { eastMeters: number; northMeters: number } {
	const originMerc = maplibregl.MercatorCoordinate.fromLngLat(originLngLat);
	const targetMerc = maplibregl.MercatorCoordinate.fromLngLat(targetLngLat);
	const metersPerUnit = 1 / originMerc.meterInMercatorCoordinateUnits();

	return {
		eastMeters: (targetMerc.x - originMerc.x) * metersPerUnit,
		// Mercator Y 轴向下为正，地理北向为正 → 取反
		northMeters: -(targetMerc.y - originMerc.y) * metersPerUnit
	};
}

/** 递归释放 Three.js 对象资源 */
function disposeGroup(object: THREE.Object3D) {
	object.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			child.geometry?.dispose();
			if (Array.isArray(child.material)) {
				child.material.forEach((m: THREE.Material) => m.dispose());
			} else {
				(child.material as THREE.Material)?.dispose();
			}
		}
	});
}

// ---------------------------------------------------------------------------
// ThreeModelLayer — 支持任意经纬度多模型的 MapLibre CustomLayer 实现
// ---------------------------------------------------------------------------

export class ThreeModelLayer implements Omit<maplibregl.CustomLayerInterface, 'id' | 'type'> {
	readonly renderingMode = '3d' as const;

	private camera = new THREE.Camera();
	private scene = new THREE.Scene();
	private renderer: THREE.WebGLRenderer | null = null;
	private map: maplibregl.Map | null = null;
	private loader = new GLTFLoader();

	/** 场景原点经纬度 */
	private sceneOrigin: [number, number];
	/** 内部模型注册表 */
	private models = new Map<string, ModelEntry>();
	/** 等待 onAdd 后再加载的初始模型 */
	private pendingModels: ModelConfig[];

	/**
	 * @param sceneOrigin 场景原点经纬度 [lng, lat]
	 * @param initialModels 初始模型列表（可选）
	 */
	constructor(sceneOrigin: [number, number], initialModels: ModelConfig[] = []) {
		this.sceneOrigin = sceneOrigin;
		this.pendingModels = initialModels;
	}

	// -----------------------------------------------------------------------
	// MapLibre CustomLayerInterface 实现
	// -----------------------------------------------------------------------

	onAdd(map: maplibregl.Map, gl: WebGL2RenderingContext) {
		this.map = map;

		// 灯光
		const light1 = new THREE.DirectionalLight(0xffffff, 1);
		light1.position.set(0, -70, 100).normalize();
		this.scene.add(light1);

		const light2 = new THREE.DirectionalLight(0xffffff, 1);
		light2.position.set(0, 70, 100).normalize();
		this.scene.add(light2);

		const ambient = new THREE.AmbientLight(0xffffff, 0.4);
		this.scene.add(ambient);

		// 用 MapLibre 的 canvas 和 WebGL 上下文创建 Three.js 渲染器
		this.renderer = new THREE.WebGLRenderer({
			canvas: map.getCanvas(),
			context: gl,
			antialias: true
		});
		this.renderer.autoClear = false;

		// 加载初始模型
		for (const config of this.pendingModels) {
			this.addModel(config);
		}
		this.pendingModels = [];
	}

	render(
		_gl: WebGL2RenderingContext | WebGLRenderingContext,
		args: maplibregl.CustomRenderMethodInput
	) {
		if (!this.map || !this.renderer) return;

		// 获取场景原点的模型矩阵（将世界原点映射到地图投影坐标系）
		const modelMatrix = this.map.transform.getMatrixForModel(this.sceneOrigin, 0);
		const viewProjection = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
		const model = new THREE.Matrix4().fromArray(modelMatrix);

		// getMatrixForModel 内部已经包含了 Mercator 缩放
		// 额外乘以 meterScale 使得 Three.js 中 1 单位 ≈ 1 米
		const originMerc = maplibregl.MercatorCoordinate.fromLngLat(this.sceneOrigin);
		const meterScale = 1 / originMerc.meterInMercatorCoordinateUnits();
		model.scale(new THREE.Vector3(meterScale, meterScale, meterScale));

		this.camera.projectionMatrix = viewProjection.multiply(model);
		this.renderer.resetState();
		this.renderer.render(this.scene, this.camera);
		this.map.triggerRepaint();
	}

	// -----------------------------------------------------------------------
	// 公开 API — 模型管理
	// -----------------------------------------------------------------------

	/** 添加模型到场景 */
	addModel(config: ModelConfig): void {
		if (this.models.has(config.id)) {
			console.warn(`[ThreeModelLayer] 模型 "${config.id}" 已存在，先移除再添加`);
			this.removeModel(config.id);
		}

		const group = new THREE.Group();
		group.name = config.id;

		// 计算该模型相对于场景原点的米制偏移
		const { eastMeters, northMeters } = lngLatToMeterOffset(this.sceneOrigin, config.lngLat);
		const altitude = config.altitude ?? 0;
		group.position.set(eastMeters, altitude, northMeters);

		// 旋转
		if (config.rotation) {
			group.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
		}

		// 缩放
		const scale = config.scale ?? 1;
		group.scale.set(scale, scale, scale);

		// 加载内容：直接传入 Object3D 或从 URL 加载 GLTF
		if (config.object) {
			group.add(config.object.clone());
			this.scene.add(group);
		} else if (config.url) {
			this.loader.load(config.url, (gltf) => {
				group.add(gltf.scene);
				this.scene.add(group);
				this.map?.triggerRepaint();
			});
		}

		this.models.set(config.id, { config, group });
	}

	/** 从场景中移除模型 */
	removeModel(id: string): boolean {
		const entry = this.models.get(id);
		if (!entry) return false;

		this.scene.remove(entry.group);
		disposeGroup(entry.group);
		this.models.delete(id);
		this.map?.triggerRepaint();
		return true;
	}

	/** 更新模型位置 / 缩放 / 旋转 */
	updateModel(id: string, updates: Partial<Omit<ModelConfig, 'id'>>): boolean {
		const entry = this.models.get(id);
		if (!entry) return false;

		if (updates.lngLat) {
			entry.config.lngLat = updates.lngLat;
			const { eastMeters, northMeters } = lngLatToMeterOffset(this.sceneOrigin, updates.lngLat);
			entry.group.position.x = eastMeters;
			entry.group.position.z = northMeters;
		}
		if (updates.altitude !== undefined) {
			entry.config.altitude = updates.altitude;
			entry.group.position.y = updates.altitude;
		}
		if (updates.scale !== undefined) {
			entry.config.scale = updates.scale;
			entry.group.scale.set(updates.scale, updates.scale, updates.scale);
		}
		if (updates.rotation) {
			entry.config.rotation = updates.rotation;
			entry.group.rotation.set(updates.rotation[0], updates.rotation[1], updates.rotation[2]);
		}

		this.map?.triggerRepaint();
		return true;
	}

	/** 获取所有已注册模型 ID */
	getModelIds(): string[] {
		return Array.from(this.models.keys());
	}
}
