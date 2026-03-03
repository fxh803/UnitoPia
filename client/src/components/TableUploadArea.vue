<script setup lang="ts">
import { ref } from 'vue'
import { useTableStore } from '~/stores/table'

const tableStore = useTableStore()

const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

// 处理拖拽
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    tableStore.handleFileUpload(files[0])
  }
}

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    tableStore.handleFileUpload(file)
  }
}
</script>

<template>
  <div v-if="tableStore.tableData.length === 0 && !tableStore.isLoading" class="flex-1 w-full p-5 bg-[var(--primary-light-color)]">
    <div
      class="border-2 h-full w-full border-dashed rounded-lg transition-colors cursor-pointer flex flex-col justify-center items-center gap-4"
      :class="{
        'border-[var(--primary-color)] bg-[var(--primary-light-color)]': isDragOver,
        'border-[var(--border-color)] hover:border-[var(--text-muted-light)]': !isDragOver
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="fileInput?.click()"
    >
      <span class="i-carbon-add-alt text-4xl text-[var(--text-muted-light)]"></span>
      <div class="text-sm font-medium text-[var(--text-muted)]">Upload Data</div>
    </div>
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept=".csv"
      @change="handleFileSelect"
    />
  </div>
</template>

