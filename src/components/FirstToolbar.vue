<script setup lang="ts"> 
import { useSelectedModeStore } from '~/stores/selectedMode'
import { storeToRefs } from 'pinia'
const selectedModeStore = useSelectedModeStore()
const {selectedMode} = storeToRefs(selectedModeStore)
const {setSelectedMode} = selectedModeStore
</script>

<template>
  <!-- 一级工具栏：模式选择 -->
  <div class="px-2 py-4 border border-[#e6e6e6] rounded-xl bg-white flex flex-col gap-3 shadow left-6 top-1/2 absolute z-10 -translate-y-1/2">
    <button
      class="rounded flex h-10 w-10 items-center justify-center"
      :class="[
        selectedMode === 'marker'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Marker Mode"
      @click="setSelectedMode('marker')"
    >
      <span class="i-carbon:data-categorical" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center"
      :class="[
        selectedMode === 'container'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Container Mode"
      @click="setSelectedMode('container')"
    >
      <span class="i-carbon:area-custom" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center"
      :class="[
        selectedMode === 'emitter'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Emitter Mode"
      @click="setSelectedMode('emitter')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
        <path d="M8 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        <path d="M6 8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
      </svg>
    </button>
  </div>
</template>
 