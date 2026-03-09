<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTableStore } from '~/stores/table'
import TableDataView from './TableData.vue'

const tableStore = useTableStore()
const { tableData, tableColumns, isLoading } = storeToRefs(tableStore)

const isExpanded = ref(true)
const activeTab = ref<'fields' | 'table'>('fields')

// 当前正在被拖拽的字段（列名 + 变体类型组合成唯一 key）
const draggingFieldKey = ref<string | null>(null)

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
const presetDropdownVisible = ref(false)

// 根据列数据推断类型前缀：# 数值型，abc 分类型/文本
function getFieldPrefix(column: string): string {
  if (!tableData.value.length) return 'abc '
  const sample = tableData.value
    .slice(0, 20)
    .map(row => row[column])
    .filter(v => v != null && String(v).trim() !== '')
  if (sample.length === 0) return 'abc '
  const allNumeric = sample.every(v => /^-?\d+(\.\d+)?$/.test(String(v).trim()))
  return allNumeric ? '# ' : 'abc '
}

const fieldTags = computed(() =>
  tableColumns.value.map(col => {
    const prefix = getFieldPrefix(col)
    const isNumeric = prefix.startsWith('#')
    return { column: col, prefix, isNumeric }
  })
)

// 将字段按类型分组：数值型 / 分类型
const numericTags = computed(() => fieldTags.value.filter(tag => tag.isNumeric))
const categoricalTags = computed(() => fieldTags.value.filter(tag => !tag.isNumeric))

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files?.length) tableStore.handleFileUpload(files[0])
}

type FieldVariant = 'field' | 'group'

function onFieldDragStart(
  e: DragEvent,
  tag: { column: string },
  type: 'numeric' | 'categorical',
  variant: FieldVariant = 'field',
) {
  if (!e.dataTransfer) return

  // 1. 设置拖拽携带的数据
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('text/plain', tag.column)
  e.dataTransfer.setData('field-type', type)
  e.dataTransfer.setData('field-variant', variant)

  // 2. 自定义拖拽时跟随鼠标的“影像”，保持 pill 原本样式
  const target = e.target as HTMLElement | null
  if (target) {
    const rect = target.getBoundingClientRect()
    const dragImage = target.cloneNode(true) as HTMLElement
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-9999px'
    dragImage.style.left = '-9999px'
    dragImage.style.pointerEvents = 'none'
    dragImage.classList.remove('data-field-placeholder')
    dragImage.querySelectorAll<HTMLElement>('*').forEach(el => {
      el.style.visibility = '' // 确保内部内容可见
    })
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2)
    // 拖拽开始后再异步移除临时节点
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage)
    })
  }

  // 3. 标记当前字段为“正在被拖拽”，让对应 pill 显示为灰色洞
  draggingFieldKey.value = `${variant}:${tag.column}`
}

function onFieldDragEnd() {
  draggingFieldKey.value = null
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) tableStore.handleFileUpload(file)
}

function clearData() {
  tableStore.clearTableData()
}

/** 预制数据：public/csv 下可直接加载的 CSV */
const PRESET_DATA = [
  { url: '/csv/nobel_prize.csv', name: 'Nobel_Prize' },
  { url: '/csv/paralympics_2024_medal_table.csv', name: 'Paralympics_2024_Medal' },
]

function loadPreset(item: { url: string; name: string }) {
  presetDropdownVisible.value = false
  tableStore.loadFromUrl(item.url, item.name)
}

// 点击外部关闭「更多」下拉
watch(presetDropdownVisible, (visible) => {
  if (!visible) return
  const close = () => {
    presetDropdownVisible.value = false
    document.removeEventListener('click', close)
  }
  nextTick(() => setTimeout(() => document.addEventListener('click', close), 0))
})
</script>

<template>
  <div
    class="border-b border-[var(--border-color)] flex flex-col min-h-0 bg-[var(--primary-light-color)]"
    :class="
      tableData.length > 0 && isExpanded
        ? activeTab === 'table'
          ? 'h-[400px]'
          : 'max-h-[400px]'
        : ''
    "
  >
    <!-- 统一的顶部区域：左侧折叠按钮 + 右侧内容（无数据时是 Data，有数据时是 Tabs + 删除） -->
    <div
      class="flex items-center w-full px-3 py-2 bg-[var(--primary-light-color)] hover:bg-[var(--border-color)]/10 transition-colors text-left gap-2 border-b-0 flex-shrink-0"
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

      <!-- 无数据：Data 标题 + 更多（预制数据下拉） -->
      <template v-if="tableData.length === 0">
        <span class="text-[16px] font-semibold text-[var(--title-color)]">Data</span>
        <div class="relative transform translate-y-0.5">
          <button
            type="button"
            class="p-0.5 rounded hover:bg-[var(--border-color)]/20 text-[var(--text-muted)] cursor-pointer"
            title="预设数据"
            @click.stop="presetDropdownVisible = !presetDropdownVisible"
          >
            <span class="i-carbon:ibm-cloud-vpc-file-storage w-4.2 h-4.2 block" />
          </button>
          <div
            v-show="presetDropdownVisible"
            class="absolute left-0 top-full mt-1 py-1 min-w-[160px] rounded-lg border border-[var(--border-color)] bg-[var(--primary-light-color)] shadow-lg z-50"
          >
            <button
              v-for="item in PRESET_DATA"
              :key="item.url"
              type="button"
              class="w-full px-3 py-2 text-left text-[13px] text-[var(--title-color)] hover:bg-[var(--border-color)]/20 transition-colors"
              @click="loadPreset(item)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
      </template>

      <!-- 有数据：显示 Tabs + 清空按钮 -->
      <template v-else>
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="px-0 py-0 text-[16px] transition-colors cursor-pointer"
            :class="activeTab === 'fields' ? 'font-semibold text-[var(--title-color)]' : 'font-semibold text-[var(--text-muted)] hover:text-[var(--title-color)]'"
            @click="activeTab = 'fields'"
          >
            Fields
          </button>
          <button
            type="button"
            class="px-0 py-0 text-[16px] transition-colors cursor-pointer"
            :class="activeTab === 'table' ? 'font-semibold text-[var(--title-color)]' : 'font-semibold text-[var(--text-muted)] hover:text-[var(--title-color)]'"
            @click="activeTab = 'table'"
          >
            Table
          </button>
        </div>
        <div class="flex-1 min-w-0" />
        <button
          type="button"
          class="rounded cursor-pointer text-black hover:text-[var(--text-muted)]"
          title="clear data"
          @click="clearData"
        >
          <span class="i-carbon-close text-lg w-5 h-5 block" />
        </button>
      </template>
    </div>

    <div v-show="isExpanded" class="flex-1 min-h-0 overflow-hidden flex flex-col">
      <!-- 无数据：上传区域 -->
      <template v-if="tableData.length === 0">
        <div
          v-if="!isLoading"
          class="flex-1 min-h-[120px] w-full p-3"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="fileInput?.click()"
        >
          <div
            class="data-upload-area h-full min-h-[100px] w-full border-2 border-dashed rounded-lg transition-colors cursor-pointer flex flex-col justify-center items-center gap-2"
            :class="{
              'border-[var(--text-muted-light)] bg-[var(--border-color)]/10': isDragOver,
              'border-[var(--border-color)]': !isDragOver,
            }"
          >
            <img src="/table upload.svg" alt="" class="w-5 h-5 text-[var(--text-muted)]" />
            <span class="text-sm font-medium text-[var(--text-muted)]">Upload Data from Computer</span>
          </div>
        </div>
        <div v-else class="flex items-center justify-center py-8 text-[var(--text-muted)] text-sm">
          Loading…
        </div>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept=".csv"
          @change="handleFileSelect"
        />
      </template>

      <!-- 有数据：Fields 或 Table 内容 -->
      <template v-else>
        <!-- Fields：同一容器，数值型一行、分类型一行 -->
        <div v-show="activeTab === 'fields'" class="flex-1 min-h-0 flex flex-col p-3">
          <div class="data-fields-container flex-1 min-h-0 flex flex-wrap items-start content-start gap-2.5 overflow-auto">
            <!-- 数值型字段 -->
            <span
              v-for="tag in numericTags"
              :key="`num-${tag.column}`"
              class="data-field-pill inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-medium cursor-move"
              :class="{ 'data-field-placeholder': draggingFieldKey === `field:${tag.column}` }"
              draggable="true"
              @dragstart="(e) => onFieldDragStart(e, tag, 'numeric')"
              @dragend="onFieldDragEnd"
            >
              <span class="data-field-prefix-num mr-1">#</span>
              <span class="data-field-name">{{ tag.column }}</span>
            </span>

            <!-- 类型行之间的换行（只有两种类型都存在时才加） -->
            <span
              v-if="numericTags.length && categoricalTags.length"
              class="w-full basis-full h-0 flex-shrink-0 block"
              aria-hidden="true"
            />

            <!-- 分类型 / 文本字段：普通 pill + Group 分身 -->
            <span
              v-for="tag in categoricalTags"
              :key="`cat-${tag.column}`"
              class="inline-flex items-center gap-2"
            >
              <!-- 普通字段 pill -->
              <span
                class="data-field-pill inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-medium cursor-move"
                :class="{ 'data-field-placeholder': draggingFieldKey === `field:${tag.column}` }"
                draggable="true"
                @dragstart="(e) => onFieldDragStart(e, tag, 'categorical', 'field')"
                @dragend="onFieldDragEnd"
              >
                <span class="data-field-prefix-abc mr-1">abc</span>
                <span class="data-field-name">{{ tag.column }}</span>
              </span>

              <!-- Group 分身 pill -->
              <span
                class="data-field-pill inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-medium cursor-move"
                :class="{ 'data-field-placeholder': draggingFieldKey === `group:${tag.column}` }"
                draggable="true"
                @dragstart="(e) => onFieldDragStart(e, tag, 'categorical', 'group')"
                @dragend="onFieldDragEnd"
              >
                <span class="data-field-prefix-abc mr-1">abc</span>
                <span class="data-field-name mr-2">{{ tag.column }}</span>
                <span class="data-field-group-chip font-semibold">Group</span>
              </span>
            </span>
          </div>
        </div>

        <!-- Table：表格 -->
        <div v-show="activeTab === 'table'" class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <TableDataView />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.data-upload-area {
  background-color: #efebea;
}

.data-fields-container {
  background-color: #efebea;
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid #cfcecd;
}

.data-field-pill {
  background-color: #fbf8f6;
  color: #444;
  border: none;
}

.data-field-placeholder {
  background-color: #d4d1cf;
  border-radius: 9999px;
}

.data-field-placeholder > * {
  visibility: hidden;
}

.data-field-prefix-num {
  color: #888;
}

.data-field-prefix-abc {
  color: #888;
}

.data-field-name {
  color: #444;
}

.data-field-group-chip {
  background-color: #efe6e1;
  color: #777;
  border-radius: 9999px;
  padding: 2px 8px;
  font-size: 11px;
}
</style>
