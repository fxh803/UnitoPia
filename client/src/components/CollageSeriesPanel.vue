<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollageSeriesStore } from '~/stores/collageSeries'
import { useCollageStore } from '~/stores/collage'

const collageSeriesStore = useCollageSeriesStore()
const collageStore = useCollageStore()
const { collageSeries, currentSlideIndex } = storeToRefs(collageSeriesStore)
const { collaging } = storeToRefs(collageStore)
const { handleCollageSeriesSelect, handleDeleteCollageSeries, addNewSlide, handleDuplicateSlide } = collageSeriesStore

// 折叠状态
const isCollapsed = ref(false)

function handleClick(idx: number) {
  handleCollageSeriesSelect(idx)
}

function handleDelete(idx: number) {
  handleDeleteCollageSeries(idx)
}

function handleDuplicate(idx: number) {
  handleDuplicateSlide(idx)
}

function handleAddNew() {
  addNewSlide()
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <div class="relative flex h-full">
    <!-- 面板内容 -->
    <aside 
      class="py-4 bg-white flex flex-col h-full items-center overflow-y-auto transition-all duration-300 shadow-right border-r border-gray-200 overflow-x-hidden relative"
      :class="isCollapsed ? 'w-13' : 'w-60'"
    >
      <!-- 拼贴处理状态遮罩 -->
      <div 
        v-if="collaging"
        class="absolute inset-0 bg-gray-300 bg-opacity-50 z-30 flex items-center justify-center"
      >
      </div>
      <!-- 收起按钮 - 放在右上角 -->
      <button
        @click="toggleCollapse"
        class="absolute top-3 right-3 z-20 bg-white hover:bg-gray-100 transition-all duration-200 p-1.5 rounded"
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <div 
          class="w-5 h-5 text-black transition-all duration-300"
          :class="isCollapsed ? 'i-carbon:open-panel-left' : 'i-carbon:open-panel-filled-left'"
        ></div>
      </button>

      <!-- 标题 -->
      <div class="w-full h-30px mb-2 border-b border-gray-200 "> 
      </div>
      
      <!-- 拼贴系列列表 -->
      <div 
        v-if="!isCollapsed"
        class="w-full px-2"
      >
        <div
          v-for="(item, idx) in collageSeries"
          :key="idx"
          class="relative mb-3 border rounded flex h-32 items-center justify-center group cursor-pointer"
          :class="[
            idx === currentSlideIndex 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-[#e6e6e6] bg-[#f5f5f5]'
          ]"
          @click="handleClick(idx)"
        >
          <!-- 删除按钮 -->
          <button
            v-if="collageSeries.length > 1"
            class="absolute top-1 right-1 z-10 hidden group-hover:block bg-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-500 hover:text-white transition-colors"
            @click.stop="handleDelete(idx)"
            title="Delete"
          >×</button>
          
                      <!-- 复制按钮 -->
            <button
              class="absolute top-1 z-10 hidden group-hover:block bg-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-blue-500 hover:text-white transition-colors"
              :class="collageSeries.length > 1 ? 'right-8' : 'right-1'"
              @click.stop="handleDuplicate(idx)"
              title="Duplicate"
            >
              <div class="i-carbon:copy text-xs transform translate-x-4px"></div>
            </button>
          
          <img :src="item.preview" class="max-h-full max-w-full object-contain">
        </div>
        
        <!-- 添加新拼贴按钮 -->
        <button
          @click="handleAddNew"
          class="w-full mb-3 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex h-32 items-center justify-center hover:bg-gray-100 transition-colors"
          title="Add New Collage"
        >
          <div class="text-gray-400 text-2xl">+</div>
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.shadow-right {
  box-shadow: 4px 0 8px -4px rgba(0,0,0,0.08);
}
</style>
