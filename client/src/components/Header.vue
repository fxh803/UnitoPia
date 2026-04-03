<script setup lang="ts">
// 页头无需复杂逻辑
//导入server composables
import { sendDataToServer } from '~/composables/server'
import { useAnimationStore } from '~/stores/animation'
import { useCollageSeriesStore } from '~/stores/collageSeries'
import { usePaperExportStore } from '~/stores/paperExport'
import { useCanvasStore } from '~/stores/canvas'
import { useMarkInstanceStore } from '~/stores/markInstance'
import { useObjectActionsStore } from '~/stores/objectActions'
import { useHoverInfoPanelStore } from '~/stores/hoverInfoPanel'
import type { ProgressItem } from '~/stores/animation'
import { useTutorialStore } from '~/stores/tutorial'
import { storeToRefs } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const animationStore = useAnimationStore()
const collageSeriesStore = useCollageSeriesStore()
const paperExportStore = usePaperExportStore()
const tutorialStore = useTutorialStore()
const canvasStore = useCanvasStore()
const markInstanceStore = useMarkInstanceStore()
const objectActionsStore = useObjectActionsStore()
const hoverInfoPanelStore = useHoverInfoPanelStore()
const { hasMarker, hasContainer } = storeToRefs(canvasStore)
const { collaging, result_data, replaying, time_interval, progress_data, replayIdx } = storeToRefs(animationStore)
// 用 computed 得到当前 progress，保证依赖 progress_data/replayIdx，进度条才能随数据更新
const progress = computed(() => {
  if (replaying.value) {
    return progress_data.value[replayIdx.value] as ProgressItem | undefined
  }
  const arr = progress_data.value
  return arr.length > 0 ? (arr[arr.length - 1] as ProgressItem) : undefined
})

// 计算进度百分比
const percentage = ref(0)

// 计算是否显示replay按钮
const showReplayButton = computed(() => result_data.value && result_data.value.length > 0 && !collaging.value)
const showBackToEditButton = computed(() => !collaging.value&&result_data.value.length>0)
const showExportButton = computed(() => !collaging.value&&result_data.value.length>0)

// Run 按钮变绿：画布同时存在 marker 与 container
const runReadyGreen = ref(false)
watch([hasMarker, hasContainer], ([m, c]) => {
  runReadyGreen.value = !!m && !!c
}, { immediate: true })

// 监听 progress 变化
watch(progress, (newProgress) => {
  if (newProgress && (collaging.value || replaying.value)) {
    const type = (newProgress.type ?? 0) as number
    const totalsteps = (newProgress.totalSteps ?? 0) as number
    const steps = (newProgress.steps ?? 0) as number
    const total_collage = (newProgress.total_collage ?? 0) as number
    if (totalsteps > 0 && total_collage > 0) {
      const currentTypeProgress = steps / totalsteps
      // 单一 overview：直接用当前 overview 内进度
      const currentProgress = (newProgress.now_collage ?? 0) + (type * 0.5 + currentTypeProgress * 0.5)
      percentage.value = Math.min(Math.max((currentProgress / total_collage) * 100, 0), 100)
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
  } else {
    // 运行时先主动收起对象操作按钮，避免悬浮转盘残留遮挡
    objectActionsStore.hideBtns()
    hoverInfoPanelStore.handleSelectionCleared()
    collageSeriesStore.setCollageSeriesPanelCollapsed(true)
    // 收起 MarkDetailPanel：清空详情面板选中项
    markInstanceStore.clearSelectedMarkForDetail()
    setTimeout(() => {
      if (result_data.value.length > 0) {
        animationStore.resetData()
        animationStore.removeElements()
        animationStore.removeAnimation()
      }
      
      sendDataToServer()
    }, 200)
  }
}

const handleBackToEdit = async () => {
  // 结果 slide 生成完后，自动切回第一个 slide
  // collageSeriesStore.handleCollageSeriesSelect(0)
  animationStore.backToEdit()
}

// 导出 paperCanvas 为 PNG 并下载
const handleExport = () => {
  if (replaying.value) return
  const canvas = paperExportStore.paperCanvasEl
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `unitopia-export-${Date.now()}.png`
  a.click()
}

// 处理调速拉条变化
const handleSpeedChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const speedMultiplier = parseFloat(target.value)

  // 将倍速转换为时间间隔 (基础时间2000ms / 倍速)
  const baseInterval = 1000
  const newInterval = Math.round(baseInterval / speedMultiplier)
  animationStore.time_interval = newInterval

  // 如果正在replay，需要重新设定timer
  if (replaying.value) {
    animationStore.updateReplayTimer()
  }
}

// 计算当前倍速显示
const currentSpeedMultiplier = computed(() => {
  const baseInterval = 1000
  return (baseInterval / time_interval.value).toFixed(1)
})

// 新建 Workspace：简单刷新页面
const handleRefresh = () => {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

// 打开教程
const handleHelp = () => {
  tutorialStore.openTutorial()
}

// 非本机时：URL 带 ?passwd= 与下方常量一致即可显示开发工具（仅防误点，不作安全依赖）
const DEV_HEADER_PASSWD = 'unitopia-dev-7k2m9pqx'

const showDevHeaderTools = computed(() => {
  if (typeof window === 'undefined') return false
  if (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname))
    return true
  const q = route.query.passwd
  const given = Array.isArray(q) ? q[0] : q
  return typeof given === 'string' && given === DEV_HEADER_PASSWD
})

// 临时导出：下载 JSON 到本地（与 handleExport PNG 方式一致）
const downloadJsonFile = (filename: string, data: unknown) => {
  if (typeof window === 'undefined') return
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const DEV_EXPORT_DOWNLOAD_GAP_MS = 150

// 一键导出：overviews、mark 实例
const handleExportDevJsonSnapshots = () => {
  const ts = Math.floor(Date.now()/1000)
  const payloads: Array<{ filename: string; data: unknown }> = [
    { filename: `collage-overviews-${ts}.json`, data: collageSeriesStore.overviews },
    { filename: `mark-instances-${ts}.json`, data: markInstanceStore.markInstances ?? [] },
  ]
  payloads.forEach((p, i) => {
    setTimeout(() => downloadJsonFile(p.filename, p.data), i * DEV_EXPORT_DOWNLOAD_GAP_MS)
  })
}
</script>

<template>
  <div class="relative">
    <header class="px-6 border-b-2 border-[#ded9d8] bg-[var(--primary-muted-color)] flex h-12 w-full items-center z-20 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
      <div class="flex items-center gap-3">
        <h1 class="topbar-label text-[#565151] flex items-center gap-2">
          <!-- <img src="/UNITVIZ2.svg" alt="UnitoPia Logo" class="h-8 w-auto" /> -->
          UnitoPia
        </h1>

        <!-- New Workspace 按钮（放在标题右侧） -->
        <button
          class="flex items-center gap-2 px-4 py-1 rounded-md bg-[var(--primary-light-color)] text-[var(--title-color)] transition-colors duration-200 font-medium hover:bg-[var(--primary-light-color)] cursor-pointer border border-[var(--border-color)]"
          @click="handleRefresh"
        >
          <span class="i-carbon:document-add text-base"></span>
          <span class="topbar-button-label">New Workspace</span>
        </button>
      </div>

      <!-- 右侧按钮组：整体靠右，最后是 Help -->
      <div class="ml-auto flex items-center gap-2">
        <!-- Replay 按钮 - 当result_data不为空时显示 -->
        <button
          v-if="showReplayButton"
          class="flex items-center gap-2 px-6 py-1 rounded-md bg-[var(--primary-light-color)] text-[var(--title-color)] transition-colors duration-200 font-medium hover:bg-[var(--primary-light-color)] border border-[var(--border-color)] cursor-pointer"
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
          <span class="topbar-button-label">{{ replaying ? 'replaying...' : 'replay' }}</span>
        </button>

        <!-- Export 按钮 -->
        <button v-show="showExportButton"
          class="flex items-center gap-2 px-6 py-1 rounded-md bg-[var(--primary-light-color)] hover:bg-[var(--primary-light-color)] text-[var(--title-color)] transition-colors duration-200 font-medium border border-[var(--border-color)] cursor-pointer"
          :class="[
            replaying ? 'opacity-50 cursor-not-allowed' : ''
          ]"
          :disabled="replaying"
          @click="handleExport">
          <div class="i-carbon:export text-lg"></div>
          <span class="topbar-button-label">Export</span>
        </button>

        <!-- Back to Edit 按钮 -->
        <button
          v-show="showBackToEditButton"
          class="flex items-center gap-2 px-6 py-1 rounded-md bg-[var(--primary-light-color)] hover:bg-[var(--primary-light-color)] text-[var(--title-color)] transition-colors duration-200 font-medium border border-[var(--border-color)] cursor-pointer"
          :class="[
            replaying ? 'opacity-50 cursor-not-allowed' : ''
          ]"
          :disabled="replaying"
          @click="handleBackToEdit"
        >
          <div class="i-carbon:edit text-lg"></div>
          <span class="topbar-button-label">Back to Edit</span>
        </button>

        <!-- Run 按钮 -->
        <button
          data-tutorial="run-button"
          class="flex items-center gap-2 px-6 py-1 rounded-md bg-[var(--primary-light-color)] text-[var(--title-color)] transition-colors duration-200 font-medium hover:bg-[var(--primary-light-color)] border border-[var(--border-color)] cursor-pointer"
          :class="[
            replaying ? 'opacity-50 cursor-not-allowed' : '',
            runReadyGreen ? 'bg-green-600 hover:bg-green-700 text-white' : ''
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
          <span class="topbar-button-label">{{ collaging ?  'Running...' : result_data.length>0 ? 'reRun' : 'Run' }}</span>
        </button>

        <!-- 一键导出 JSON：overviews、mark 实例 -->
        <button
          v-if="showDevHeaderTools"
          class="flex items-center gap-1 px-3 py-1 rounded-md bg-[var(--primary-light-color)] text-[var(--text-muted)] text-xs transition-colors duration-200 hover:bg-[var(--primary-light-color)] border border-[var(--border-color)] cursor-pointer"
          @click="handleExportDevJsonSnapshots"
        >
          <span class="i-carbon:document-export text-sm"></span>
          <span class="topbar-button-label text-xs">export snapshots</span>
        </button>

        <!-- Help 按钮 - 靠右 -->
        <button
          class="flex items-center gap-2 px-4 py-1 rounded-md bg-[var(--primary-light-color)] text-[var(--title-color)] transition-colors duration-200 font-medium hover:bg-[var(--primary-light-color)] border border-[var(--border-color)] cursor-pointer"
          @click="handleHelp"
        >
          <span class="i-carbon:help text-lg"></span>
          <span class="topbar-button-label">Help</span>
        </button>

        <!-- 调速拉条 - 只在replay模式下显示 -->
        <div
          v-if="replaying"
          class="flex items-center gap-3 px-6 py-1 rounded-md bg-[var(--primary-light-color)] border-l border-[var(--border-color)] ml-2"
        >
        <div class="i-carbon:time text-lg text-[var(--text-muted)]"></div>
        <span class="text-sm text-[var(--text-muted)] font-medium">Speed:</span>
        <input
          type="range"
          min="0.5"
          max="16.0"
          step="0.1"
          :value="currentSpeedMultiplier"
          @input="handleSpeedChange"
          class="w-24 h-2 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer slider"
        />
        <span class="text-xs text-[var(--text-muted)] min-w-12">{{ currentSpeedMultiplier }}x</span>
        </div>
      </div>
    </header>

    <!-- 进度条 - 移到header外部，使用fixed定位 -->
    <div
      v-if="collaging||replaying"
      class="fixed top-11 left-0 w-full bg-[var(--border-color)] h-2 z-9999"
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
  background: var(--border-color);
  outline: none;
  border-radius: 8px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: var(--primary-hover-color);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  cursor: pointer;
  border-radius: 50%;
  border: none;
  transition: background-color 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: var(--primary-hover-color);
}

/* 顶部导航标题：IBM Plex Sans 20px Medium，略紧字距 */
.topbar-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 24px;
  line-height: 28px;
  letter-spacing: -0.2px;
}

/* 顶部按钮文字：稍小一号 */
.topbar-button-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.1px;
}

</style>
