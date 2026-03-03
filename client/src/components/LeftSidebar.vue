<script setup lang="ts">
// 左侧边栏：Data、Marks、Libraries 三块可折叠，垂直排布
</script>

<template>
  <aside
    class="h-full w-full flex flex-col min-h-0 overflow-hidden border-r border-[var(--border-color)] bg-[var(--primary-light-color)]"
  >
    <!-- 顶部 Data / Marks 固定高度 -->
    <DataSection class="flex-shrink-0" />
    <MarksSection class="flex-shrink-0" />
    <!-- 底部 Libraries 占用剩余高度，内部再滚动 -->
    <LibrariesSection class="flex-1 min-h-0 overflow-hidden" />
  </aside>
</template>
