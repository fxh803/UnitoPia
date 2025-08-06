<script setup lang="ts">
import { ref } from 'vue'
import Table from './Table.vue'
import Overview from './Overview.vue'


// 切换状态
const activeTab = ref<'table' | 'overview'>('table')

// 切换标签页
const switchTab = (tab: 'table' | 'overview') => {
  activeTab.value = tab
}
</script>

<template>
  <aside class="border-r border-gray-200 bg-gray-50 h-full w-full flex flex-col relative">
    <!-- 切换栏 -->
    <div class="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
      <div class="flex justify-center space-x-6">
        <button class="relative px-1 py-2 text-sm font-medium transition-colors duration-200" :class="[
          activeTab === 'table'
            ? 'text-[#0d99ff]'
            : 'text-gray-400 hover:text-gray-600'
        ]" @click="switchTab('table')">
          Table
          <!-- 下划线指示器 -->
          <div v-if="activeTab === 'table'"
            class="absolute bottom-0 left-0 h-0.5 bg-[#0d99ff] transition-all duration-200 w-full"></div>
        </button>
        <button class="relative px-1 py-2 text-sm font-medium transition-colors duration-200" :class="[
          activeTab === 'overview'
            ? 'text-[#0d99ff]'
            : 'text-gray-400 hover:text-gray-600'
        ]" @click="switchTab('overview')">
          Overview
          <!-- 下划线指示器 -->
          <div v-if="activeTab === 'overview'"
            class="absolute bottom-0 left-0 h-0.5 bg-[#0d99ff] transition-all duration-200 w-full"></div>
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <!-- Table 模式 -->
      <div v-if="activeTab === 'table'" class="h-full">
        <Table />
      </div>

      <!-- Overview 模式 -->
      <div v-else-if="activeTab === 'overview'" class="h-full">
        <Overview />
      </div>
    </div>
  </aside>
</template>
