<script lang="ts">
	import ToolbarButton from './ToolbarButton.svelte';
	import ToolbarGroup from './ToolbarGroup.svelte';
	import ThemePanel from './ThemePanel.svelte';

	interface Props {
		themes: string[];
		currentTheme: string;
		currentView: '2d' | '3d';
		projection: 'mercator' | 'globe';
		onthemechange: (theme: string) => void;
		onviewchange: (view: '2d' | '3d') => void;
		onprojectionchange: (projection: 'mercator' | 'globe') => void;
	}

	let {
		themes,
		currentTheme,
		currentView,
		projection,
		onthemechange,
		onviewchange,
		onprojectionchange
	}: Props = $props();

	/** 当前激活的绘图/测量工具 */
	type DrawTool =
		| 'draw-point'
		| 'draw-line'
		| 'draw-polygon'
		| 'measure-distance'
		| 'measure-area'
		| null;
	let activeTool = $state<DrawTool>(null);

	function toggleView() {
		onviewchange(currentView === '2d' ? '3d' : '2d');
	}

	function toggleProjection() {
		onprojectionchange(projection === 'mercator' ? 'globe' : 'mercator');
	}

	function handleDrawTool(tool: DrawTool) {
		activeTool = activeTool === tool ? null : tool;
	}
</script>

<div class="map-toolbar">
	<!-- 视图切换：单按钮 toggle + 地球切换 -->
	<ToolbarGroup>
		<ToolbarButton
			label={currentView === '2d' ? '切换到 3D 视图' : '切换到 2D 视图'}
			onclick={toggleView}
		>
			{#if currentView === '2d'}
				<!-- 2D 图标: 正方形 -->
				<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
			{:else}
				<!-- 3D 图标: 立方体 -->
				<svg viewBox="0 0 24 24">
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
			{/if}
		</ToolbarButton>
		<ToolbarButton
			label={projection === 'mercator' ? '开启地球模式' : '开启平面模式'}
			active={projection === 'globe'}
			onclick={toggleProjection}
		>
			<!-- 地球图标 -->
			<svg viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" />
				<path
					d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
				/>
			</svg>
		</ToolbarButton>
	</ToolbarGroup>

	<!-- 绘图工具 -->
	<ToolbarGroup>
		<ToolbarButton
			label="画点"
			active={activeTool === 'draw-point'}
			onclick={() => handleDrawTool('draw-point')}
		>
			<!-- 标记点图标 -->
			<svg viewBox="0 0 24 24">
				<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
				<circle cx="12" cy="9" r="2.5" />
			</svg>
		</ToolbarButton>
		<ToolbarButton
			label="画线"
			active={activeTool === 'draw-line'}
			onclick={() => handleDrawTool('draw-line')}
		>
			<!-- 折线图标 -->
			<svg viewBox="0 0 24 24">
				<polyline points="4 20 10 10 16 14 20 4" />
				<circle cx="4" cy="20" r="1.5" fill="currentColor" />
				<circle cx="20" cy="4" r="1.5" fill="currentColor" />
			</svg>
		</ToolbarButton>
		<ToolbarButton
			label="画面"
			active={activeTool === 'draw-polygon'}
			onclick={() => handleDrawTool('draw-polygon')}
		>
			<!-- 多边形图标 -->
			<svg viewBox="0 0 24 24">
				<polygon points="12 3 20 9 18 18 6 18 4 9" />
			</svg>
		</ToolbarButton>
	</ToolbarGroup>

	<!-- 测量工具 -->
	<ToolbarGroup>
		<ToolbarButton
			label="测距"
			active={activeTool === 'measure-distance'}
			onclick={() => handleDrawTool('measure-distance')}
		>
			<!-- 直尺图标 -->
			<svg viewBox="0 0 24 24">
				<path d="M3 5h18v14H3z" />
				<path d="M7 5v4M11 5v6M15 5v4M19 5v4" />
			</svg>
		</ToolbarButton>
		<ToolbarButton
			label="测面积"
			active={activeTool === 'measure-area'}
			onclick={() => handleDrawTool('measure-area')}
		>
			<!-- 面积图标 -->
			<svg viewBox="0 0 24 24">
				<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="4 2" />
				<path d="M4 4l16 16" opacity="0.4" />
			</svg>
		</ToolbarButton>
	</ToolbarGroup>

	<!-- 主题切换：hover 显示 -->
	<ToolbarGroup>
		<div class="hover-menu">
			<ToolbarButton label="切换主题">
				<!-- 调色板图标 -->
				<svg viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="10" />
					<circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
					<circle cx="8.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
					<circle cx="15.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
					<circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
				</svg>
			</ToolbarButton>
			<div class="hover-panel">
				<ThemePanel {themes} current={currentTheme} onselect={onthemechange} />
			</div>
		</div>
	</ToolbarGroup>
</div>

<style>
	.map-toolbar {
		position: absolute;
		top: 20px;
		right: 20px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		background: rgba(10, 15, 30, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 12px;
		padding: 4px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.35),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}

	.hover-menu {
		position: relative;
	}

	.hover-panel {
		display: none;
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		padding: 4px 10px 4px 4px;
	}

	.hover-menu:hover .hover-panel {
		display: block;
	}
</style>
