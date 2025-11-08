import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Canvas } from 'fabric'

export const useHoverInfoPanelStore = defineStore('hoverInfoPanel', () => {
  const showPanel = ref(false)
  const panelPosition = ref({ x: 0, y: 0 })
  const markerData = ref<any>(null)
  // 存储所有 overview 中每个 slide 的 dataBinding 数据
  const allData = ref<Array<{
    overviewId: string
    slides: Array<{
      slideId?: string
      dataBinding: Array<{ data: Array<any>, markerId: string }>
    }>
  }>>([])
  
  // 当前悬浮的 marker 对象
  let currentMarker: any = null
  // 当前悬浮的 raster 对象
  let currentRaster: any = null
  
  // 更新面板位置（用于 fabric canvas）
  function updatePanelPosition(e: MouseEvent, canvasInstance: Canvas | null) {
    if (!canvasInstance) return
    
    const canvasEl = canvasInstance.getElement()
    if (!canvasEl) return
    
    const canvasRect = canvasEl.getBoundingClientRect()
    
    // 计算相对于画布的位置
    const relativeX = e.clientX - canvasRect.left
    const relativeY = e.clientY - canvasRect.top
    
    // 面板显示在鼠标右下方，偏移 10px
    const offsetX = 10
    const offsetY = 10
    
    // 确保面板不超出画布边界
    const panelWidth = 300 // 预估面板宽度
    const panelHeight = 200 // 预估面板高度
    
    let x = relativeX + offsetX
    let y = relativeY + offsetY
    
    // 如果右侧空间不足，显示在左侧
    if (x + panelWidth > canvasRect.width) {
      x = relativeX - panelWidth - offsetX
    }
    
    // 如果下方空间不足，显示在上方
    if (y + panelHeight > canvasRect.height) {
      y = relativeY - panelHeight - offsetY
    }
    
    panelPosition.value = { x, y }
  }
  
  // 处理 marker 悬浮
  function handleMarkerHover(e: any, canvasInstance: Canvas | null) {
    console.log('handleMarkerHover')
    const target = e.target
    if (target && target.get('data')) {
      const data = target.get('data')
      if (data) {
        currentMarker = target
        markerData.value = data
        showPanel.value = true
        // 使用当前鼠标位置更新面板位置
        if (e.e && canvasInstance) {
          updatePanelPosition(e.e, canvasInstance)
        }
      }
    }
  }
  
  // 处理鼠标离开 marker
  function handleMarkerOut(e: any) {
    console.log('handleMarkerOut')
    const target = e.target
    if (target &&target.get('data')) {
      // 如果离开的是当前悬浮的 marker，隐藏面板
      if (target === currentMarker || !currentMarker) {
        showPanel.value = false
        markerData.value = null
        currentMarker = null
      }
    }
  }
  
  // 处理画布鼠标移动
  function handleCanvasMouseMove(e: any, canvasInstance: Canvas | null) {
    if (showPanel.value && e.e && canvasInstance) {
      updatePanelPosition(e.e, canvasInstance)
    }
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 更新面板位置（用于 paper.js canvas）
  function updatePanelPositionForPaper(e: MouseEvent, paperCanvas: HTMLCanvasElement | null) {
    if (!paperCanvas) return
    
    const canvasRect = paperCanvas.getBoundingClientRect()
    
    // 计算相对于画布的位置
    const relativeX = e.clientX - canvasRect.left
    const relativeY = e.clientY - canvasRect.top
    
    // 面板显示在鼠标右下方，偏移 10px
    const offsetX = 10
    const offsetY = 10
    
    // 确保面板不超出画布边界
    const panelWidth = 300 // 预估面板宽度
    const panelHeight = 200 // 预估面板高度
    
    let x = relativeX + offsetX
    let y = relativeY + offsetY
    
    // 如果右侧空间不足，显示在左侧
    if (x + panelWidth > canvasRect.width) {
      x = relativeX - panelWidth - offsetX
    }
    
    // 如果下方空间不足，显示在上方
    if (y + panelHeight > canvasRect.height) {
      y = relativeY - panelHeight - offsetY
    }
    
    panelPosition.value = { x, y }
  }
  
  // 处理 raster 悬浮
  function handleRasterHover(event: any, raster: any) {
    if (!raster || !raster.dataBinding) return
    
    currentRaster = raster
    // raster.dataBinding 是一个数组，格式为 Array<{ data: Array<any>, markerId: string }>
    // 我们需要将其转换为类似 marker data 的格式，或者直接使用 dataBinding
    markerData.value = raster.dataBinding
    showPanel.value = true
    
    // 获取 paper.js canvas 元素
    const paperCanvas = document.querySelector('.paper-canvas') as HTMLCanvasElement
    if (event && event.event && paperCanvas) {
      // paper.js 事件对象包含 event.event 作为原始 DOM 事件
      updatePanelPositionForPaper(event.event, paperCanvas)
    } else if (event && paperCanvas) {
      // 如果没有 event.event，尝试直接使用 event
      // 某些情况下可能需要手动创建 MouseEvent
      const mouseEvent = event.event || new MouseEvent('mousemove', {
        clientX: event.point?.x || 0,
        clientY: event.point?.y || 0
      })
      updatePanelPositionForPaper(mouseEvent, paperCanvas)
    }
  }
  
  // 处理鼠标离开 raster
  function handleRasterOut(event: any, raster: any) {
    if (raster && raster === currentRaster) {
      showPanel.value = false
      markerData.value = null
      currentRaster = null
    }
  }
  
  // 处理 paper.js 画布鼠标移动
  function handlePaperCanvasMouseMove(event: any) {
    if (showPanel.value && currentRaster) {
      const paperCanvas = document.querySelector('.paper-canvas') as HTMLCanvasElement
      if (event && event.event && paperCanvas) {
        updatePanelPositionForPaper(event.event, paperCanvas)
      }
    }
  }
  
  return {
    showPanel,
    panelPosition,
    markerData,
    allData,
    updatePanelPosition,
    handleMarkerHover,
    handleMarkerOut,
    handleCanvasMouseMove,
    handleRasterHover,
    handleRasterOut,
    handlePaperCanvasMouseMove
  }
})

