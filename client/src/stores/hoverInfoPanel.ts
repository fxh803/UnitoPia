import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Canvas } from 'fabric'

export const useHoverInfoPanelStore = defineStore('hoverInfoPanel', () => {
  const showPanel = ref(false)
  const markerData = ref<any>(null)
  // 存储所有 overview 中每个 slide 的 dataBinding 数据
  const allData = ref<Array<{
    overviewId: string
    slides: Array<{
      slideId?: string
      dataBinding: Array<{ data: Array<any>, markerId: string }>
    }>
  }>>([])

  // 处理 marker 悬浮
  function handleMarkerHover(e: any, canvasInstance: Canvas | null) {
    // 如果有选中的对象，忽略 hover
    const activeObject = canvasInstance?.getActiveObject()
    if (activeObject) {
      return
    }
    const target = e.target
    // 没有选中对象时，正常处理 hover
    if (target && target.get('data')) {
      const data = target.get('data')
      if (data) {
        markerData.value = data
        showPanel.value = true
      }
    }
  }

  // 处理鼠标离开 marker
  function handleMarkerOut(e: any, canvasInstance: Canvas | null) {
    // 如果有选中的对象，忽略 hover out
    const activeObject = canvasInstance?.getActiveObject()
    if (activeObject) {
      return
    }
    showPanel.value = false
    markerData.value = null
  }

  // 处理 raster 悬浮
  function handleRasterHover(event: any, raster: any) {
    if (!raster || !raster.dataBinding) return

    // raster.dataBinding 是一个数组，格式为 Array<{ data: Array<any>, markerId: string }>
    // 我们需要将其转换为类似 marker data 的格式，或者直接使用 dataBinding
    markerData.value = raster.dataBinding
    showPanel.value = true
  }

  // 处理鼠标离开 raster
  function handleRasterOut(event: any, raster: any) {
    if (raster) {
      showPanel.value = false
      markerData.value = null
    }
  }

  // 处理选中对象
  function handleSelection(e: any, canvasInstance: Canvas | null) {
    const activeObject = canvasInstance?.getActiveObject()
    if (activeObject) {
      // 如果是 activeSelection（多选），直接返回，不处理
      if (activeObject.type === 'activeSelection') {
        return
      }
      // 单个对象选中
      if (activeObject.get('data')) {
        const data = activeObject.get('data')
        if (data) {
          markerData.value = data
          showPanel.value = true
        }
      }
    }
  }

  // 处理取消选中
  function handleSelectionCleared() {
    showPanel.value = false
    markerData.value = null
  }

  return {
    showPanel,
    markerData,
    allData,
    handleMarkerHover,
    handleMarkerOut,
    handleRasterHover,
    handleRasterOut,
    handleSelection,
    handleSelectionCleared
  }
})

