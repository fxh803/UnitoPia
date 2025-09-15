import { defineStore } from 'pinia'

export const useBackgroundStore = defineStore('background', () => {
  // 存储每个总览的背景，key为overviewId
  const overviewBackgrounds = ref<Record<string, string | null>>({})
  const creatingBackground = ref(false)
  const canvasRef = ref<(() => Canvas | null) | null>(null)
  
  const setCanvas = (canvas: () => Canvas | null) => {
    canvasRef.value = canvas
  }

  // 获取当前总览的背景
  const getCurrentOverviewBackground = (overviewId: string) => {
    return overviewBackgrounds.value[overviewId] || null
  }

  // 设置当前总览的背景
  const setCurrentOverviewBackground = (overviewId: string, background: string | null) => {
    overviewBackgrounds.value[overviewId] = background
  }

  // 清除当前总览的背景
  const clearCurrentOverviewBackground = (overviewId: string) => {
    overviewBackgrounds.value[overviewId] = null
  }

  // 清除画布上的背景对象
  const clearBackgroundFromCanvas = () => {
    const canvasInstance = canvasRef.value?.()
    if (!canvasInstance) return
    const objects = canvasInstance.getObjects()
    objects.forEach(obj => {
      if (obj.get('dataType') === 'background') {
        canvasInstance.remove(obj)
      }
    })
    canvasInstance.renderAll()
  }

  // 清除指定总览的背景（从存储和画布）
  const clearBackground = (overviewId?: string) => {
    if (overviewId) {
      clearCurrentOverviewBackground(overviewId)
    }
    clearBackgroundFromCanvas()
  }

  return {
    overviewBackgrounds,
    creatingBackground,
    canvasRef,
    setCanvas,
    getCurrentOverviewBackground,
    setCurrentOverviewBackground,
    clearCurrentOverviewBackground,
    clearBackgroundFromCanvas,
    clearBackground
  }
})