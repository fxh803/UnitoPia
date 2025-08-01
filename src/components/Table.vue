<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface TableData {
  [key: string]: any
}

interface Props {
  tableData: TableData[]
  tableColumns: string[]
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dataUpdate: [data: TableData[], columns: string[]]
}>()

const isDragOver = ref(false)

// 为了兼容VXE表格，重命名变量
const csvData = computed(() => props.tableData)
const csvHeaders = computed(() => props.tableColumns)

// 处理滚动事件
const handleScrolling = () => {
  // 可以在这里添加滚动处理逻辑
  console.log('表格滚动中...')
}

// 单元格类名处理
const cellClassName = ({ row, column }: any) => {
  // 可以根据需要返回自定义的CSS类名
  return ''
}

// 解析 CSV 行
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// 处理文件上传
const handleFileUpload = async (file: File) => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    ElMessage.error('请上传 CSV 文件')
    return
  }

  try {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      ElMessage.error('CSV 文件为空')
      return
    }

    // 解析 CSV
    const headers = parseCSVLine(lines[0])
    const data: TableData[] = []
    const maxRows = 300 // 限制最大行数
    const rowsToProcess = Math.min(lines.length - 1, maxRows)

    for (let i = 1; i <= rowsToProcess; i++) {
      const values = parseCSVLine(lines[i])
      const row: TableData = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }

    const totalRows = lines.length - 1
    const loadedRows = data.length
    ElMessage.success(`成功上传 ${file.name}，加载了 ${loadedRows} 行数据${totalRows > maxRows ? `（共 ${totalRows} 行，仅显示前 ${maxRows} 行）` : ''}`)
    
    // 通知父组件数据更新
    emit('dataUpdate', data, headers)
  } catch (error) {
    ElMessage.error('文件解析失败')
    console.error('CSV 解析错误:', error)
  }
}

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
    handleFileUpload(files[0])
  }
}

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFileUpload(file)
  }
}
</script>

<template>
  <div class="h-full border-b border-gray-200 relative">
    <!-- 上传区域 - 只在没有数据时显示 -->
    <div v-if="tableData.length === 0 && !isLoading" class="h-full w-full p-5">
      <div
        class="border-2 h-full w-full border-dashed border-gray-300 rounded-lg  transition-colors cursor-pointer flex justify-center items-center"
        :class="{
          'border-blue-500 bg-blue-50': isDragOver,
          'hover:border-gray-400': !isDragOver
        }" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop"
        @click="$refs.fileInput.click()">
        <input ref="fileInput" type="file" class="hidden" accept=".csv" @change="handleFileSelect" />
        <span class="i-carbon-add-alt text-4xl text-gray-400"></span>
      </div>

    </div>

    <!-- 数据表格区域 - 只在有数据时显示 -->
    <div v-else-if="tableData.length > 0" class="h-full w-full overflow-hidden"
      style="min-width: 0; min-height: 0; max-width: 100%; max-height: 100%; contain: layout size;">
      <vxe-table :data="csvData" :scroll-y="{ enabled: true }" :scroll-x="{ enabled: true }" height="100%"
        @scroll="handleScrolling()" :row-config="{ isHover: true }" :cell-config="{ height: 30 }"
        show-header-overflow show-overflow size="small" border :cell-class-name="cellClassName" :auto-resize="true">
        <vxe-column v-for="(item, index) in csvHeaders" :key="index" :field="item" :title="item" row-resize
          min-width="80" />
      </vxe-table>
    </div>
  </div>
</template>

<style scoped>
/* Carbon 图标样式 */
.i-carbon\:add-alt::before {
  content: '\f0c9';
  font-family: 'carbon-icons';
}
</style>
