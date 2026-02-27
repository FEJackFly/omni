<script lang="ts">
	import { page } from '$app/state';
	alert(page.params.id);
</script>

<h1>用户详情</h1>
<p>当前访问的用户 ID 是: {page.params.id}</p>
<a href="/">返回首页</a>
