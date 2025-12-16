<script setup lang="ts">
import { useSelectedModeStore } from '~/stores/selectedMode'
import { useAnimationStore } from '~/stores/animation'
import { storeToRefs } from 'pinia'

const selectedModeStore = useSelectedModeStore()
const animationStore = useAnimationStore()
const {selectedMode} = storeToRefs(selectedModeStore)
const {collaging,result_data} = storeToRefs(animationStore)
const {setSelectedMode} = selectedModeStore
</script>

<template>
  <!-- 一级工具栏：模式选择 -->
  <div v-show="!collaging&&!result_data.length>0" class="toolbar-container px-2 py-4 border border-[#e6e6e6] rounded-tr-xl rounded-br-xl bg-white flex flex-col gap-3 shadow">
    <button
      class="toolbar-btn rounded flex h-10 items-center cursor-pointer overflow-hidden transition-all text-black"
      :class="[
        selectedMode === 'container'
          ? 'bg-[var(--primary-color)]'
          : 'bg-white hover:bg-[#f5f5f5]',
        collaging ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @click="setSelectedMode('container')"
    >
      <span class="i-carbon:area-custom flex-shrink-0 w-10 flex items-center justify-center" />
      <span class="text-sm font-medium whitespace-nowrap">Container</span>
    </button>
    <button
      class="toolbar-btn rounded flex h-10 items-center cursor-pointer overflow-hidden transition-all text-black"
      :class="[
        selectedMode === 'emitter'
          ? 'bg-[var(--primary-color)]'
          : 'bg-white hover:bg-[#f5f5f5]',
        collaging ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @click="setSelectedMode('emitter')"
    >
      <div class="i-carbon:anchor flex-shrink-0 w-10 flex items-center justify-center"></div>
      <span class="text-sm font-medium whitespace-nowrap">Emitter</span>
    </button>
    <button
      class="toolbar-btn rounded flex h-10 items-center cursor-pointer overflow-hidden transition-all text-black"
      :class="[
        selectedMode === 'force'
          ? 'bg-[var(--primary-color)]'
          : 'bg-white hover:bg-[#f5f5f5]',
        collaging ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @click="setSelectedMode('force')"
    >
      <span class="flex-shrink-0 w-10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" class="w-5 h-5">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
            <path d="M20 8L24 4M24 4L28 8M24 4V16"/>
            <path d="M20 40L24 44M24 44L28 40M24 44V32"/>
            <path d="M40 20L44 24M44 24L40 28M44 24H32"/>
            <path d="M8 20L4 24M4 24L8 28M4 24H16"/>
            <circle cx="24" cy="24" r="2"/>
          </g>
        </svg>
      </span>
      <span class="text-sm font-medium whitespace-nowrap">Force</span>
    </button>
  </div>
</template>

<style scoped>
.toolbar-container {
  width: auto;
}

.toolbar-btn {
  width: 40px; /* w-10 */
  gap: 0;
}

.toolbar-btn span:last-child {
  opacity: 0;
  width: 0;
  overflow: hidden;
  transition: opacity 0.2s, width 0.2s;
}

.toolbar-container:hover .toolbar-btn {
  width: auto;
  padding-right: 12px; /* px-3 */
  gap: 8px; /* gap-2 */
}

.toolbar-container:hover .toolbar-btn span:last-child {
  opacity: 1;
  width: auto;
}
</style>
