<script setup lang="ts">
// 页头无需复杂逻辑
//导入server composables
import { collectAllSlidesData, sendDataToServer } from '~/composables/server'
import { useAnimationStore } from '~/stores/animation'
import { useCanvasStore } from '~/stores/canvas'
import { storeToRefs } from 'pinia'
import { ref, watch, computed } from 'vue'
import {fabric} from 'fabric'
import { FabricImage } from 'fabric'
const animationStore = useAnimationStore()
const canvasStore = useCanvasStore()
const { collaging, progress, result_data, replaying,now_overview_idx,totalOverview, time_interval, srcArray,widthArray,heightArray,angleArray,posArray } = storeToRefs(animationStore)

// 计算进度百分比
const percentage = ref(0)

// 计算是否显示replay按钮
const showReplayButton = computed(() => result_data.value && result_data.value.length > 0 && !collaging.value)
const showBackToEditButton = computed(() => !collaging.value&&result_data.value.length>0)
const showExportButton = computed(() => !collaging.value&&result_data.value.length>0)
const showRunButton = computed(() => result_data.value.length===0 || collaging.value)

// 监听progress变化，计算进度
watch(progress, (newProgress) => {
  if (newProgress && collaging.value || replaying.value) {
    const type = newProgress.type
    const totalsteps = newProgress.totalSteps
    const steps = newProgress.steps
    const now_collage = newProgress.now_collage
    const total_collage = newProgress.total_collage
    const now_overview = newProgress.now_overview_idx 
    if (totalsteps > 0 && total_collage > 0 && totalOverview.value > 0) {
      const currentTypeProgress = steps / totalsteps
      
      // 计算当前overview内的进度
      const currentOverviewProgress = (now_collage + currentTypeProgress / 2 + 1 / 2 * type) / total_collage
      
      // 计算前面overview的累计进度
      const previousOverviewProgress = now_overview / totalOverview.value
      
      // 计算当前overview占总进度的比例
      const currentOverviewWeight = 1 / totalOverview.value
      
      // 总进度 = 前面overview的进度 + 当前overview的进度
      percentage.value = (previousOverviewProgress + currentOverviewProgress * currentOverviewWeight) * 100
      
      // 确保百分比在0-100之间
      percentage.value = Math.min(Math.max(percentage.value, 0), 100)
    }
  } else {
    percentage.value = 0
  }
})

// 处理replay按钮点击
const handleReplay = () => {
  if (replaying.value) {
    animationStore.stopReplay()
  } else {
    percentage.value = 0
    animationStore.replay()
  }
}

const handleRun = () => {
  if (collaging.value) {
    return
  }else{
    if (result_data.value.length>0) {
      animationStore.resetData()
      animationStore.removeElements()
      animationStore.removeAnimation() 
    }
    sendDataToServer()
  }
}

const handleBackToEdit = async () => {
  // 先移除画布事件监听器
  canvasStore.removeCanvasEventListeners()
  
  // 获取canvas实例
  const canvasInstance = canvasStore.canvasRef?.()
  if (canvasInstance) {
    // 删除所有现有对象
    const allObjects = canvasInstance.getObjects()
    allObjects.forEach(obj => {
      canvasInstance.remove(obj)
    })
    
    // 遍历srcArray创建新对象
    for (let index = 0; index < srcArray.value.length; index++) {
      const src = srcArray.value[index]
      try {
        const fabricImg = await FabricImage.fromURL(src, {
          crossOrigin: 'anonymous'
        }) 
        
        // 设置基本属性
        fabricImg.set({
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          dataType: 'marker'
        })
        
        // 应用位置数据
        if (posArray.value[index]) {
          fabricImg.set({
            left: posArray.value[index][0],
            top: posArray.value[index][1]
          })
        }
        // 应用尺寸数据
        if (widthArray.value[index] && heightArray.value[index]) {
          // 获取对象的原始尺寸
          const originalWidth = fabricImg.width || fabricImg.getScaledWidth() / (fabricImg.scaleX || 1)
          const originalHeight = fabricImg.height || fabricImg.getScaledHeight() / (fabricImg.scaleY || 1)
          
          // 计算目标尺寸：80 * size * canvas_width/1000
          const targetWidth =  widthArray.value[index]  
          const targetHeight =   heightArray.value[index]  
          console.log('targetWidth',targetWidth)
          console.log('targetHeight',targetHeight)
          console.log('originalWidth',originalWidth)
          console.log('originalHeight',originalHeight)
          // 计算缩放比例
          const scaleX = targetWidth / originalWidth
          const scaleY = targetHeight / originalHeight
          
          fabricImg.set({
            scaleX: scaleX,
            scaleY: scaleY
          })
        }
        
        // 应用角度数据
        if (angleArray.value[index]) {
          fabricImg.set({
            angle: angleArray.value[index] * (180 / Math.PI) // 转换为度数
          })
        }
        
        // 将对象添加到画布
        canvasInstance.add(fabricImg)
        
      } catch (error) {
        console.error(`加载图片失败 (${src}):`, error)
      }
    }
    
    // 重新渲染画布
    canvasInstance.renderAll()
  }
  
  // 重新添加画布事件监听器
  canvasStore.addCanvasEventListeners()

  //输出4个array
  console.log('srcArray',srcArray.value)
  console.log('posArray',posArray.value)
  console.log('widthArray',widthArray.value)
  console.log('heightArray',heightArray.value)
  console.log('angleArray',angleArray.value)
  //输出绘制的对象
  console.log('elements',canvasInstance.getObjects())
  animationStore.backToEdit()
}

// 处理调速拉条变化
const handleSpeedChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const speedMultiplier = parseFloat(target.value)
  
  // 将倍速转换为时间间隔 (基础时间2000ms / 倍速)
  const baseInterval = 2000
  const newInterval = Math.round(baseInterval / speedMultiplier)
  animationStore.time_interval = newInterval
  
  // 如果正在replay，需要重新设定timer
  if (replaying.value) {
    animationStore.updateReplayTimer()
  }
}

// 计算当前倍速显示
const currentSpeedMultiplier = computed(() => {
  const baseInterval = 2000
  return (baseInterval / time_interval.value).toFixed(1)
})
</script>

<template>
  <div class="relative">
    <header class="px-6 border-b border-gray-200 bg-white flex h-14 w-full shadow items-center z-20">
      <h1 class="text-xl text-gray-800 font-bold ">
        Unitopia
      </h1>
      
      <!-- 播放按钮 -->
      <button 
        class="ml-50px flex items-center gap-2 px-6 h-full bg-white  text-gray-800 transition-colors duration-200 font-medium border-l border-gray-200"
        :class="[
          collaging ? 'hover:bg-[var(--delete-color)]' : 'hover:bg-gray-100',
          replaying ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :disabled="replaying"
        @click="handleRun"
      >
        <div 
          v-if="!collaging"
          class="i-carbon:play text-lg"
        ></div>
        <div 
          v-else
          class="i-carbon:renew animate-spin text-lg"
        ></div>
        <span>{{ collaging ?  'Running...' : result_data.length>0 ? 'reRun' : 'Run' }}</span>
       
      </button>
      
      <!-- Replay 按钮 - 当result_data不为空时显示 -->
      <button 
        v-if="showReplayButton"
        class="flex items-center gap-2 px-6 h-full bg-white  text-gray-800 transition-colors duration-200 font-medium border-l border-gray-200"
        :class="replaying ? 'hover:bg-[var(--delete-color)]' : 'hover:bg-gray-100'"
        @click="handleReplay"
      >
        <div 
          v-if="!replaying"
          class="i-carbon:reset text-lg" 
        ></div>
        <div 
          v-else
          class="i-carbon:renew animate-spin text-lg"
        ></div>
        <span>{{ replaying ? 'replaying...' : 'play' }}</span>
      </button>
      
      <!-- Export 按钮 -->
      <button v-show="showExportButton" 
      class="flex items-center gap-2 px-6 h-full bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-medium border-l border-gray-200"
      :class="[ 
          replaying ? 'opacity-50 cursor-not-allowed' : ''
        ]">
        <div class="i-carbon:export text-lg"></div>
        <span>Export</span>
      </button>
      
      <!-- Back to Edit 按钮 -->
      <button 
        v-show="showBackToEditButton"
        class="flex items-center gap-2 px-6 h-full bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-medium border-l border-gray-200"
        :class="[
          replaying ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :disabled="replaying"
        @click="handleBackToEdit"
      >
        <div class="i-carbon:edit text-lg"></div>
        <span>Back to Edit</span>
      </button>
      
      <!-- 调速拉条 - 只在replay模式下显示 -->
      <div 
        v-if="replaying"
        class="flex items-center gap-3 px-6 h-full bg-white border-l border-gray-200"
      >
        <div class="i-carbon:time text-lg text-gray-600"></div>
        <span class="text-sm text-gray-600 font-medium">Speed:</span>
        <input
          type="range"
          min="0.5"
          max="4.0"
          step="0.1"
          :value="currentSpeedMultiplier"
          @input="handleSpeedChange"
          class="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <span class="text-xs text-gray-500 min-w-12">{{ currentSpeedMultiplier }}x</span>
      </div>
    </header>

    <!-- 进度条 - 移到header外部，使用fixed定位 -->
    <div 
      v-if="collaging||replaying"
      class="fixed top-14 left-0 w-full bg-gray-200 h-2 z-50"
    >
      <div 
        class="bg-[var(--primary-color)] h-full transition-all duration-300 ease-out"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.slider {
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  outline: none;
  border-radius: 8px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  cursor: pointer;
  border-radius: 50%;
  border: none;
  transition: background-color 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #2563eb;
}
</style>
