<script setup lang="ts">
// 左侧边栏：Data、Marks、Libraries 三块可折叠，垂直排布
</script>

<template>
  <aside
    class="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden border-[var(--border-color)] bg-[var(--primary-muted-color)]"
  >
    <!-- Data 卡片 -->
    <div class=" bg-[var(--primary-light-color)] shadow-sm overflow-hidden min-h-0 flex-shrink-0">
      <DataSection class="flex-shrink-0" />
    </div>

    <!-- Marks 卡片 -->
    <div class="mt-2 bg-[var(--primary-light-color)] shadow-sm overflow-hidden min-h-0 flex-shrink-0">
      <MarksSection class="flex-shrink-0" />
    </div>

    <!-- Libraries：外层占满剩余高度（无背景，露出 muted）；内层卡片高度随内容，超出时由整个侧栏滚动 -->
    <div class="mt-2 flex-1 min-h-0">
      <div class=" bg-[var(--primary-light-color)] shadow-sm overflow-hidden flex-shrink-0">
        <LibrariesSection class="flex-1 min-h-0 overflow-hidden" />
      </div>
    </div> 
  </aside>
</template>
