<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMarkInstanceStore, type ColorStop } from '~/stores/markInstance'
import { useTableStore } from '~/stores/table'

const markInstanceStore = useMarkInstanceStore()
const { markInstances, selectedMarkForDetail } = storeToRefs(markInstanceStore)

const tableStore = useTableStore()
const { tableData } = storeToRefs(tableStore)

const currentEncoding = computed(() => {
  const sel = selectedMarkForDetail.value
  if (!sel) return null
  if (sel.type === 'childInstance') {
    const parent = markInstances.value.find(x => x.id === sel.parentMarkId)
    const child = parent?.children?.find(c => c.id === sel.childId) as any
    return child?.encoding ?? null
  }
  const m = markInstances.value.find(x => x.id === sel.markId) as any
  return m?.encoding ?? null
})

const displayName = computed(() => {
  const sel = selectedMarkForDetail.value
  if (!sel) return ''
  if (sel.type === 'singleInstance') {
    const m = markInstances.value.find(x => x.id === sel.markId)
    return m?.name ?? 'Mark'
  }
  const parent = markInstances.value.find(x => x.id === sel.parentMarkId)
  const child = parent?.children?.find(c => c.id === sel.childId)
  return child?.name ?? parent?.name ?? 'Mark'
})

const currentColorFieldName = computed(() => {
  const enc = currentEncoding.value as any
  return enc?.color ?? null
})

const isColorNumeric = computed(() => (currentEncoding.value as any)?.colorMode === 'numeric')

// 数值型颜色映射对应字段的数据范围和精度（用于 NumericColorStopsEditor 的展示/编辑）
const colorNumericDomain = computed(() => {
  const field = currentColorFieldName.value
  if (!field || !isColorNumeric.value) {
    return { min: 0, max: 3, decimals: 1 }
  }

  const data = tableData.value || []
  const values: number[] = []
  let maxDecimals = 0
  data.forEach(row => {
    if (!row) return
    const raw = (row as any)[field]
    if (raw == null || raw === '') return
    const str = String(raw)
    const v = Number(str)
    if (!Number.isNaN(v)) {
      values.push(v)
      const dot = str.indexOf('.')
      if (dot >= 0) {
        const decLen = str.length - dot - 1
        if (decLen > maxDecimals) maxDecimals = decLen
      }
    }
  })

  if (!values.length) {
    return { min: 0, max: 3, decimals: 1 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const decimals = Math.min(Math.max(maxDecimals, 0), 6) || 1
  return { min, max, decimals }
})

// 数值型颜色映射的颜色停靠点（如果没有显式配置，则使用固定默认色带）
const colorStops = computed<ColorStop[]>({
  get() {
    const defaultStops: ColorStop[] = [
      { position: 0, color: '#A7C8FB', opacity: 1 },
      { position: 1, color: '#5592F9', opacity: 1 },
    ]

    const sel = selectedMarkForDetail.value
    if (!sel) {
      return defaultStops
    }

    let rawStops: ColorStop[] | undefined
    if (sel.type === 'childInstance') {
      const parent = markInstances.value.find(x => x.id === sel.parentMarkId) as any
      const child = parent?.children?.find((c: any) => c.id === sel.childId)
      rawStops = (child?.colorStops as ColorStop[] | undefined) || (parent?.colorStops as ColorStop[] | undefined)
    } else {
      const m = markInstances.value.find(x => x.id === sel.markId) as any
      rawStops = m?.colorStops as ColorStop[] | undefined
    }

    if (!rawStops || rawStops.length === 0) {
      return defaultStops
    }

    return [...rawStops]
      .map(stop => ({
        position: Math.min(1, Math.max(0, stop.position)),
        color: stop.color || '#ffffff',
        opacity: stop.opacity == null ? 1 : Math.min(1, Math.max(0, stop.opacity)),
      }))
      .sort((a, b) => a.position - b.position)
  },
  set(nextStops: ColorStop[]) {
    const sel = selectedMarkForDetail.value
    if (!sel) return

    const sanitized = [...nextStops]
      .map(stop => ({
        position: Math.min(1, Math.max(0, stop.position)),
        color: stop.color || '#ffffff',
        opacity: stop.opacity == null ? 1 : Math.min(1, Math.max(0, stop.opacity)),
      }))
      .sort((a, b) => a.position - b.position)

    if (sel.type === 'childInstance') {
      markInstanceStore.updateChildInstance(sel.parentMarkId, sel.childId, {
        colorStops: sanitized,
      } as any)
    } else {
      markInstanceStore.updateMarkInstance(sel.markId, {
        colorStops: sanitized,
      } as any)
    }
  },
})

const categoricalColors = computed<Record<string, string> | null>({
  get() {
    const sel = selectedMarkForDetail.value
    if (!sel) return null
    if (sel.type === 'childInstance') {
      const parent = markInstances.value.find(x => x.id === sel.parentMarkId) as any
      const child = parent?.children?.find((c: any) => c.id === sel.childId)
      return (child?.categoricalColors as Record<string, string> | undefined) ||
        (parent?.categoricalColors as Record<string, string> | undefined) ||
        null
    }
    const m = markInstances.value.find(x => x.id === sel.markId) as any
    return (m?.categoricalColors as Record<string, string> | undefined) || null
  },
  set(next) {
    const sel = selectedMarkForDetail.value
    if (!sel) return
    if (sel.type === 'childInstance') {
      markInstanceStore.updateChildInstance(sel.parentMarkId, sel.childId, {
        categoricalColors: next || undefined,
      } as any)
    } else {
      markInstanceStore.updateMarkInstance(sel.markId, {
        categoricalColors: next || undefined,
      } as any)
    }
  },
})

function resetEncoding() {
  const sel = selectedMarkForDetail.value
  if (!sel) return

  if (sel.type === 'childInstance') {
    markInstanceStore.updateChildInstance(sel.parentMarkId, sel.childId, {
      encoding: {} as any,
    })
  } else {
    markInstanceStore.updateMarkInstance(sel.markId, {
      encoding: {} as any,
    } as any)
  }
}

// 拖拽悬停：在 Visual Encoding 外围时 4 个 pill 都高亮，进入某个 pill 时只高亮该 pill
const encodingSectionRef = ref<HTMLElement | null>(null)
const isDragOverEncodingSection = ref(false)
const dragOverEncodingChannel = ref<string | null>(null)

function onEncodingSectionDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  isDragOverEncodingSection.value = true
}

function onEncodingSectionDragLeave(e: DragEvent) {
  const el = encodingSectionRef.value
  const related = e.relatedTarget as Node | null
  if (!related || !el?.contains(related)) {
    isDragOverEncodingSection.value = false
    dragOverEncodingChannel.value = null
  }
}

function onEncodingPillDragEnter(channel: string) {
  dragOverEncodingChannel.value = channel
}

function onEncodingPillDragLeave(e: DragEvent) {
  const related = e.relatedTarget as Node | null
  const current = e.currentTarget as HTMLElement
  if (!related || !current.contains(related)) dragOverEncodingChannel.value = null
}

function isPillHighlighted(channel: string): boolean {
  if (dragOverEncodingChannel.value) return dragOverEncodingChannel.value === channel
  return isDragOverEncodingSection.value
}

function handleEncodingDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handleEncodingDrop(e: DragEvent, channelLabel: string) {
  e.preventDefault()
  isDragOverEncodingSection.value = false
  dragOverEncodingChannel.value = null
  const column = e.dataTransfer?.getData('text/plain')
  if (!column) return

  const sel = selectedMarkForDetail.value
  if (!sel) return

  const key = channelLabel.toLowerCase() as 'color' | 'size' | 'width' | 'height'
  const isColorChannel = channelLabel === 'Color'
  // Color 通道的 colorMode 由 DataSection 拖拽时设置的 field-type 决定
  const fieldType = e.dataTransfer?.getData('field-type') as 'numeric' | 'categorical' | ''

  const defaultStops: ColorStop[] = [
    { position: 0, color: '#A7C8FB', opacity: 1 },
    { position: 1, color: '#5592F9', opacity: 1 },
  ]

  // 新规则：
  // - color 可与 size/width/height 共存
  // - size/width/height 三者互斥（切换其中一个时清空另外两个）
  const computeNextEncoding = (prev: any) => {
    const next: any = { ...(prev || {}) }

    if (isColorChannel) {
      next.color = column
      if (fieldType === 'numeric' || fieldType === 'categorical') {
        next.colorMode = fieldType
      }
      return next
    }

    // 处理 size/width/height：三者互斥，但不影响 color
    delete next.size
    delete next.width
    delete next.height
    next[key] = column
    return next
  }

  if (sel.type === 'childInstance') {
    // 子实例：单独管理 encoding
    const parent = markInstances.value.find(m => m.id === sel.parentMarkId)
    const child = parent?.children?.find(c => c.id === sel.childId) as any
    const prevEncoding = child?.encoding ?? {}
    const nextEncoding = computeNextEncoding(prevEncoding)
    const payload: any = {
      encoding: nextEncoding,
    }
    // 如果是 Color 通道且还没有设置过色带，则写入默认色带，保证 drop 时有颜色
    if (isColorChannel && !child?.colorStops) {
      payload.colorStops = defaultStops
    }
    markInstanceStore.updateChildInstance(sel.parentMarkId, sel.childId, payload)
  } else {
    // 非 group 或父实例
    const mark = markInstances.value.find(m => m.id === sel.markId) as any
    const prevEncoding = mark?.encoding ?? {}
    const nextEncoding = computeNextEncoding(prevEncoding)
    const payload: any = {
      encoding: nextEncoding,
    }
    if (isColorChannel && !mark?.colorStops) {
      payload.colorStops = defaultStops
    }
    markInstanceStore.updateMarkInstance(sel.markId, payload)
  }
}
</script>

<template>
  <aside
    class="h-full w-full flex flex-col min-h-0 overflow-y-auto border border-[var(--border-color)] bg-[var(--primary-muted-color)] space-y-2"
    data-tutorial="mark-detail-panel"
  >
    <!-- Visual Encoding：卡片 -->
    <div class="space-y-2 bg-[var(--primary-light-color)] shadow-sm px-3 py-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-[var(--title-color)]">Visual Encoding</span>
        <button
          type="button"
          class="px-2 py-1.5 rounded-lg hover:bg-[var(--border-color)]/20 text-[var(--text-muted)] hover:text-[var(--title-color)] flex items-center gap-1 text-sm"
          title="reset"
          @click="resetEncoding"
        >
          <span class="i-carbon-renew text-lg" />
        </button>
      </div>
      <div
        ref="encodingSectionRef"
        class="flex flex-col gap-2 rounded-lg transition-colors"
        @dragover.prevent="onEncodingSectionDragOver"
        @dragleave="onEncodingSectionDragLeave"
      >
        <div
          v-for="channel in ['Color', 'Size', 'Width', 'Height']"
          :key="channel"
          class="flex flex-col gap-1 rounded-lg bg-[var(--border-color)]/40 border border-[var(--border-color)] px-3 py-1 min-h-[48px]"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-[var(--title-color)] shrink-0 w-16">{{ channel }}</span>
            <div
              class="ml-auto shrink-0 w-[220px] rounded-full border-2 py-1.5 px-3 flex items-center justify-center min-h-[36px] gap-2 transition-[border-color,box-shadow]"
              :class="isPillHighlighted(channel)
                ? 'border-dashed border-2 border-[var(--text-muted-light)] bg-[var(--border-color)]/10'
                : 'border-dashed border-[var(--border-color)] bg-white'"
              @dragover="handleEncodingDragOver"
              @dragenter.prevent="onEncodingPillDragEnter(channel)"
              @dragleave="onEncodingPillDragLeave"
              @drop="handleEncodingDrop($event, channel)"
            >
              <span
                v-if="currentEncoding && currentEncoding[channel.toLowerCase()]"
                class="text-xs font-semibold text-[var(--title-color)] truncate"
              >
                {{ currentEncoding[channel.toLowerCase()] }}
              </span>
              <span
                v-else
                class="text-xs font-bold text-[var(--text-muted)]/70"
              >
                Drop Fields Here
              </span>
            </div>
          </div>

          <!-- 颜色通道下方：根据字段类型切换不同取色器 -->
          <template v-if="channel === 'Color' && currentEncoding && currentEncoding[channel.toLowerCase()]">
            <!-- 数值型字段：多色阶渐变编辑器（独立组件） -->
            <div v-if="isColorNumeric" class="pl-1 pr-1 pb-1">
              <NumericColorStopsEditor
                :stops="colorStops"
                :min="colorNumericDomain.min"
                :max="colorNumericDomain.max"
                :decimals="colorNumericDomain.decimals"
                @update:stops="colorStops = $event"
              />
            </div>

            <!-- 分类型字段：类别列表取色（独立组件） -->
            <div v-else class="pl-1 pr-1 pb-1">
              <CategoricalColorEditor
                v-if="currentColorFieldName"
                :field-name="currentColorFieldName"
                :table-data="tableData"
                :value-colors="categoricalColors || undefined"
                @update:valueColors="categoricalColors = $event"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Mark 编辑面板 -->
    <div class="flex-1 min-h-[50%] bg-[var(--primary-light-color)] px-4 py-3 flex flex-col gap-3 overflow-hidden">
      <!-- 顶部标题 + 工具栏 -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-[var(--title-color)] truncate">
          {{ displayName }}
        </span> 
          <MarkerToolbar /> 
      </div>

      <!-- 画布区域 -->
      <div class="bg-[#fffef8] flex-1 min-h-0 rounded-2xl bg-white border border-[#f3e9e3] overflow-hidden">
        <MarkerCanvasArea :show-toolbar="false" class="h-full w-full" />
      </div>
    </div>
  </aside>
</template>
