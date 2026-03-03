<script lang="ts">
	import ToolbarButton from './ToolbarButton.svelte';
	import ToolbarGroup from './ToolbarGroup.svelte';
	import ThemePanel from './ThemePanel.svelte';
	import {
		Palette,
		PenTool,
		MapPin,
		Spline,
		Pentagon,
		Ruler,
		Scaling,
		Square,
		Box,
		Globe,
		Plus,
		Minus
	} from 'lucide-svelte';

	interface Props {
		themes: string[];
		currentTheme: string;
		currentView: '2d' | '3d';
		projection: 'mercator' | 'globe';
		bearing: number;
		onthemechange: (theme: string) => void;
		onviewchange: (view: '2d' | '3d') => void;
		onprojectionchange: (projection: 'mercator' | 'globe') => void;
		onzoomchange: (delta: number) => void;
		onbearingreset: () => void;
		onmeasure: (mode: 'distance' | 'area' | null) => void;
	}

	let {
		themes,
		currentTheme,
		currentView,
		projection,
		bearing,
		onthemechange,
		onviewchange,
		onprojectionchange,
		onzoomchange,
		onbearingreset,
		onmeasure
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

		// 同步测量模式至父组件
		if (activeTool === 'measure-distance') {
			onmeasure('distance');
		} else if (activeTool === 'measure-area') {
			onmeasure('area');
		} else {
			onmeasure(null);
		}
	}
</script>

<div class="map-toolbar">
	<!-- 主题切换：二级菜单 -->
	<ToolbarGroup>
		<div class="hover-menu">
			<ToolbarButton label="切换主题">
				<Palette size={18} />
			</ToolbarButton>
			<div class="hover-panel">
				<ThemePanel {themes} current={currentTheme} onselect={onthemechange} />
			</div>
		</div>
	</ToolbarGroup>

	<!-- 绘图工具：二级菜单 -->
	<ToolbarGroup>
		<div class="hover-menu">
			<ToolbarButton label="绘图工具" active={!!activeTool && activeTool.startsWith('draw-')}>
				<PenTool size={18} />
			</ToolbarButton>
			<div class="hover-panel">
				<div class="vertical-panel">
					<ToolbarButton
						label="画点"
						active={activeTool === 'draw-point'}
						onclick={() => handleDrawTool('draw-point')}
					>
						<MapPin size={18} />
					</ToolbarButton>
					<ToolbarButton
						label="画线"
						active={activeTool === 'draw-line'}
						onclick={() => handleDrawTool('draw-line')}
					>
						<Spline size={18} />
					</ToolbarButton>
					<ToolbarButton
						label="画面"
						active={activeTool === 'draw-polygon'}
						onclick={() => handleDrawTool('draw-polygon')}
					>
						<Pentagon size={18} />
					</ToolbarButton>
				</div>
			</div>
		</div>
	</ToolbarGroup>

	<!-- 测量工具：二级菜单 -->
	<ToolbarGroup>
		<div class="hover-menu">
			<ToolbarButton label="测量工具" active={!!activeTool && activeTool.startsWith('measure-')}>
				<Ruler size={18} />
			</ToolbarButton>
			<div class="hover-panel">
				<div class="vertical-panel">
					<ToolbarButton
						label="测距"
						active={activeTool === 'measure-distance'}
						onclick={() => handleDrawTool('measure-distance')}
					>
						<Ruler size={18} />
					</ToolbarButton>
					<ToolbarButton
						label="测面积"
						active={activeTool === 'measure-area'}
						onclick={() => handleDrawTool('measure-area')}
					>
						<Scaling size={18} />
					</ToolbarButton>
				</div>
			</div>
		</div>
	</ToolbarGroup>

	<!-- 视图切换：单按钮 toggle + 地球切换 -->
	<ToolbarGroup>
		<ToolbarButton
			label={currentView === '2d' ? '切换到 3D 视图' : '切换到 2D 视图'}
			onclick={toggleView}
		>
			{#if currentView === '2d'}
				<Square size={18} />
			{:else}
				<Box size={18} />
			{/if}
		</ToolbarButton>
		<ToolbarButton
			label={projection === 'mercator' ? '开启地球模式' : '开启平面模式'}
			active={projection === 'globe'}
			onclick={toggleProjection}
		>
			<Globe size={18} />
		</ToolbarButton>
	</ToolbarGroup>

	<!-- 导航工具：缩放与指南针 -->
	<ToolbarGroup>
		<ToolbarButton label="放大" onclick={() => onzoomchange(1)}>
			<Plus size={18} />
		</ToolbarButton>
		<ToolbarButton label="缩小" onclick={() => onzoomchange(-1)}>
			<Minus size={18} />
		</ToolbarButton>
		<ToolbarButton label="指南针" onclick={onbearingreset}>
			<!-- 指南针保留自定义 SVG：需要指针随 bearing 动态旋转 -->
			<svg
				viewBox="0 0 24 24"
				style:transform="rotate({-bearing}deg)"
				style:transition="transform 0.2s ease"
			>
				<path d="M12 2l4 9h-8l4-9z" fill="var(--ui-accent)" stroke="none" />
				<path d="M12 22l-4-9h8l-4 9z" fill="var(--ui-text)" stroke="none" opacity="0.6" />
			</svg>
		</ToolbarButton>
	</ToolbarGroup>
</div>

<style>
	.map-toolbar {
		position: absolute;
		top: 30px;
		right: 20px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		background: var(--ui-surface);
		border: 1px solid var(--ui-border);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 12px;
		padding: 4px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
		transition: all 0.3s ease;
	}

	.hover-menu {
		position: relative;
	}

	.hover-panel {
		display: none;
		position: absolute;
		right: 100%;
		top: 0;
		padding: 0 10px 0 0;
		animation: fade-in 0.2s ease-out;
		z-index: 100;
	}

	.vertical-panel {
		background: var(--ui-surface);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--ui-border);
		border-radius: 10px;
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.hover-menu:hover .hover-panel {
		display: block;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateX(10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
