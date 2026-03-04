/*
 * @Author: jack 501177081@qq.com
 * @Date: 2026-03-03 14:33:53
 * @LastEditors: jack 501177081@qq.com
 * @LastEditTime: 2026-03-03 16:58:39
 * @FilePath: /svelte_omni/src/lib/components/measure/measure.svelte.ts
 * @Description:
 *
 * Copyright (c) 2026 by 北京主线科技有限公司京ICP备19025226号-1, All Rights Reserved.
 */
import { lineString, polygon, featureCollection, point } from '@turf/helpers';
import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';

/**
 * 格式化距离显示
 * @param meters 距离（米）
 * @returns 格式化后的字符串（<1km 显示 m，>=1km 显示 km）
 */
export function formatDistance(meters: number): string {
	if (meters < 1000) {
		return `${meters.toFixed(2)} m`;
	}
	return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * 格式化面积显示
 * @param squareMeters 面积（平方米）
 * @returns 格式化后的字符串（<1km² 显示 m²，>=1km² 显示 km²）
 */
export function formatArea(squareMeters: number): string {
	if (squareMeters < 1_000_000) {
		return `${squareMeters.toFixed(2)} m²`;
	}
	return `${(squareMeters / 1_000_000).toFixed(2)} km²`;
}

/**
 * 格式化经纬度坐标为字符串
 * @param lng 经度
 * @param lat 纬度
 * @returns 格式化后的坐标字符串 (fixed to 6 decimal places)
 */
export function formatLngLat(lng: number, lat: number): string {
	return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
}

/**
 * 将坐标点集构建为 GeoJSON 线条要素
 * @param points 坐标点数组 [[lng, lat], ...]
 * @returns LineString 要素或 null（点数不足 2 个时）
 */
export function buildLineGeoJSON(points: [number, number][]): Feature<LineString> | null {
	if (points.length < 2) return null;
	return lineString(points);
}

/**
 * 将坐标点集构建为 GeoJSON 多边形要素
 * @param points 坐标点数组 [[lng, lat], ...]
 * @returns Polygon 要素或 null（点数不足 3 个时）
 */
export function buildPolygonGeoJSON(points: [number, number][]): Feature<Polygon> | null {
	if (points.length < 3) return null;
	// turf 的 polygon 要求首尾相连
	const closed = [...points, points[0]];
	return polygon([closed]);
}

/**
 * 将坐标点集转换为 GeoJSON 点要素集合
 * @param points 坐标点数组 [[lng, lat], ...]
 * @returns Point 要素集合
 */
export function buildPointsGeoJSON(points: [number, number][]): FeatureCollection<Point> {
	return featureCollection(points.map((p) => point(p)));
}

/**
 * 获取多边形的几何中心（平均值中心）
 * @param points 坐标点数组 [[lng, lat], ...]
 * @returns 中心坐标 [lng, lat] 或 null
 */
export function getPolygonCentroid(points: [number, number][]): [number, number] | null {
	if (points.length === 0) return null;
	const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
	return [sum[0] / points.length, sum[1] / points.length];
}
