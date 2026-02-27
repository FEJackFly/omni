/*
 * @Author: jack 501177081@qq.com
 * @Date: 2026-02-12 16:36:14
 * @LastEditors: jack 501177081@qq.com
 * @LastEditTime: 2026-02-12 16:46:04
 * @FilePath: /svelte_omni/vite.config.ts
 * @Description:
 *
 * Copyright (c) 2026 by 北京主线科技有限公司京ICP备19025226号-1, All Rights Reserved.
 */
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: { host: true, port: 3000 }
});
