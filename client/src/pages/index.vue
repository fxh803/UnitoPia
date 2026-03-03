<script setup lang="ts">
</script>

<template>
  <div class="bg-[var(--primary-light-color)] flex flex-col h-screen w-screen dark:bg-gray-900">
    <Header />
    <TutorialOverlay />
    <div class="flex-1 min-h-0">
      <ResizableContainer>
        <template #left>
          <DataEditor />
        </template>
        <template #right>
          <CanvasArea />
        </template>
      </ResizableContainer>
    </div>
  </div>
</template>
