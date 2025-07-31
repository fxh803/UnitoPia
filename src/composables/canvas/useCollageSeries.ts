import { ref } from 'vue'
import type { Canvas } from 'fabric'

export function useCollageSeries(canvas: () => Canvas | null) {
  const collageSeries = ref<{ json: string, preview: string }[]>([])
  const currentSlideIndex = ref(0)
  const stopListen = ref(false) // 添加标志 

  // 初始化一个空白幻灯片
  function initializeEmptySlide() { 
    const canvasInstance = canvas()
    if (!canvasInstance) return

    canvasInstance.renderAll()
    const json = JSON.stringify(canvasInstance.toJSON())
    const preview = canvasInstance.toDataURL({
      format: 'png',
      multiplier: 2
    })
    collageSeries.value = [{ json, preview }]
    currentSlideIndex.value = 0
  }

  // 更新当前幻灯片
  function updateCurrentSlide() { 
    if (stopListen.value) return // 如果是幻灯片操作，不更新

    const canvasInstance = canvas()
    if (!canvasInstance || collageSeries.value.length === 0) return

    canvasInstance.renderAll()
    const json = JSON.stringify(canvasInstance.toJSON())
    const preview = canvasInstance.toDataURL({
      format: 'png',
      multiplier: 2
    })
    collageSeries.value[currentSlideIndex.value] = { json, preview }
  }

  // 清空画布
  function clearCanvas() { 
    const canvasInstance = canvas()
    if (!canvasInstance) return

    const objects = canvasInstance.getObjects().concat() 
    if(objects.length > 0){
      objects.forEach(obj => canvasInstance.remove(obj))
      canvasInstance.discardActiveObject()
    }
  }

  // 添加新幻灯片
  function addNewSlide() { 
    const canvasInstance = canvas()
    if (!canvasInstance) return
    stopListen.value = true
    // 清空画布
    clearCanvas()
    
    // 确保画布状态正确
    canvasInstance.renderAll()

    // 创建新的空白幻灯片
    const json = JSON.stringify(canvasInstance.toJSON())
    const preview = canvasInstance.toDataURL({
      format: 'png',
      multiplier: 2
    })
    collageSeries.value.push({ json, preview })
    currentSlideIndex.value = collageSeries.value.length - 1
    stopListen.value = false
  }

  // 选择幻灯片
  function handleCollageSeriesSelect(idx: number) { 
    const canvasInstance = canvas()
    if (!canvasInstance || !collageSeries.value[idx]) return
    stopListen.value = true
    currentSlideIndex.value = idx
    const json = collageSeries.value[idx].json
    const jsonObj = typeof json === 'string' ? JSON.parse(json) : json
     
    // 清空当前画布
    clearCanvas()
    if(jsonObj.objects.length > 0){
      // 加载选中的幻灯片
      canvasInstance.loadFromJSON(json, () => {
        setTimeout(() => {
          if (canvasInstance) {
            canvasInstance.renderAll()
          }
          stopListen.value = false
        }, 100)
      })
    }else{
      stopListen.value = false
    }
  }

  // 删除幻灯片
  function handleDeleteCollageSeries(idx: number) { 

    if (collageSeries.value.length <= 1) return // 至少保留一个幻灯片

    // 如果删除的是当前幻灯片 
    if (idx === currentSlideIndex.value) {
      currentSlideIndex.value = Math.max(0, idx - 1)
      handleCollageSeriesSelect(currentSlideIndex.value)
    } else if(idx < currentSlideIndex.value){
      currentSlideIndex.value -= 1
    }
    collageSeries.value.splice(idx, 1)
  }

  // 监听画布变化，自动更新当前幻灯片
  function setupCanvasChangeListener() { 
    const canvasInstance = canvas()
    if (!canvasInstance) return

    canvasInstance.on('object:added', updateCurrentSlide)
    canvasInstance.on('object:modified', updateCurrentSlide)
    canvasInstance.on('object:removed', updateCurrentSlide)
    canvasInstance.on('object:updated', updateCurrentSlide)
  }

  return {
    collageSeries,
    currentSlideIndex,
    initializeEmptySlide,
    updateCurrentSlide,
    addNewSlide,
    handleCollageSeriesSelect,
    handleDeleteCollageSeries,
    setupCanvasChangeListener,
  }
} 