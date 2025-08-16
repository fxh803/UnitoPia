<script setup lang="ts">
// 页头无需复杂逻辑
//导入server composables
import { collectAllSlidesData, sendDataToServer } from '~/composables/server'
import { useCollageStore } from '~/stores/collage'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

const collageStore = useCollageStore()
const { collaging, progress } = storeToRefs(collageStore)

// 计算进度百分比
const percentage = ref(0)

// 监听progress变化，计算进度
watch(progress, (newProgress) => {
  if (newProgress && collaging.value) {
    const type = newProgress.type
    const totalsteps = newProgress.totalSteps
    const steps = newProgress.steps
    const now_collage = newProgress.now_collage
    const total_collage = newProgress.total_collage
    
    if (totalsteps > 0 && total_collage > 0) {
      const currentTypeProgress = steps / totalsteps
      percentage.value = ((now_collage + currentTypeProgress / 2 + 1 / 2 * type) / total_collage) * 100
      // 确保百分比在0-100之间
      percentage.value = Math.min(Math.max(percentage.value, 0), 100)
    }
  } else {
    percentage.value = 0
  }
}, { immediate: true })
</script>

<template>
  <div class="relative">
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

    <!-- 进度条 - 移到header外部，使用fixed定位 -->
    <div 
      v-if="collaging"
      class="fixed top-16 left-0 w-full bg-gray-200 h-2 z-50"
    >
      <div 
        class="bg-blue-600 h-full transition-all duration-300 ease-out"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
  </div>
</template>
