<script setup lang="ts">
// 页头无需复杂逻辑
//导入server composables
import { collectAllSlidesData, sendDataToServer } from '~/composables/server'
import { useCollageStore } from '~/stores/collage'
import { storeToRefs } from 'pinia'

const collageStore = useCollageStore()
const { collaging } = storeToRefs(collageStore)
</script>

<template>
  <header class="px-6 border-b border-gray-200 bg-white flex h-16 w-full shadow items-center z-20">
    <h1 class="text-xl text-gray-800 font-bold ">
      Unitopia
    </h1>
    
    <!-- 播放按钮 -->
    <button 
      class="ml-50px flex items-center gap-2 px-6 h-full bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-medium border-l border-gray-200"
      @click="sendDataToServer"
      :disabled="collaging"
    >
      <div 
        v-if="!collaging"
        class="i-carbon:play text-lg"
      ></div>
      <div 
        v-else
        class="i-carbon:renew animate-spin text-lg"
      ></div>
      <span>{{ collaging ? 'Running...' : 'Run' }}</span>
    </button>
    
    <!-- Export 按钮 -->
    <button class="flex items-center gap-2 px-6 h-full bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-medium">
      <div class="i-carbon:export text-lg"></div>
      <span>Export</span>
    </button>
  </header>
</template>
