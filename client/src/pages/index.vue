<script setup lang="ts">
</script>

<template>
  <div class="bg-[var(--primary-light-color)] flex flex-col h-screen w-screen dark:bg-gray-900">
    <Header />
    <TutorialOverlay />
    <!-- Header 下方的整块内容区：主内容 + Gallery 都在此区域内，Gallery 不盖住 Header -->
    <div class="h-full relative overflow-hidden">
      <!-- 主内容区 -->
        <ResizableContainer>
          <template #left>
            <LeftSidebar />
          </template>
          <template #right>
            <CanvasArea />
          </template>
        </ResizableContainer>
      <!-- Gallery -->
      <CollageSeriesPanel />
    </div>
  </div>
</template>
