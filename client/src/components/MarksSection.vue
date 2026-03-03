<script setup lang="ts">
import { ref } from 'vue'

const isExpanded = ref(true)
</script>

<template>
  <div class="border-b border-[var(--border-color)] flex flex-col min-h-0">
    <!-- 标题栏：左侧折叠按钮 + 标题（只有箭头可点击） -->
    <div
      class="flex items-center w-full px-3 py-2 bg-[var(--primary-light-color)] hover:bg-[var(--border-color)]/10 transition-colors text-left gap-2"
    >
      <button
        type="button"
        class="p-0.5 rounded hover:bg-[var(--border-color)]/20 transition-colors text-[var(--text-muted)] cursor-pointer"
        @click="isExpanded = !isExpanded"
      >
        <div
          class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          :class="isExpanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'"
        />
      </button>
      <span class="text-[14px] font-bold text-[var(--title-color)]">Marks</span>
    </div>
    <!-- 内容区：占位，后续实现 -->
    <div v-show="isExpanded" class="flex-1 min-h-0 overflow-auto p-2">
      <slot />
    </div>
  </div>
</template>
