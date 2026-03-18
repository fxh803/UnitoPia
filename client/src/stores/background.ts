import { defineStore } from 'pinia'
import type { Canvas } from 'fabric'
import { ref } from 'vue'

export type BackgroundTransform = {
  left: number
  top: number
  scaleX: number
  scaleY: number
  originX: 'left' | 'center' | 'right'
  originY: 'top' | 'center' | 'bottom'
}

export const useBackgroundStore = defineStore('background', () => {
  // 存储每个总览的背景，key为overviewId
  const overviewBackgrounds = ref<Record<string, string | null>>({})
  // 存储每个总览背景的几何信息（位置/缩放/origin），用于跨 slide 复用
  const overviewBackgroundTransforms = ref<Record<string, BackgroundTransform | null>>({})
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

  const getCurrentOverviewBackgroundTransform = (overviewId: string) => {
    return overviewBackgroundTransforms.value[overviewId] || null
  }

  const setCurrentOverviewBackgroundTransform = (
    overviewId: string,
    transform: BackgroundTransform | null
  ) => {
    overviewBackgroundTransforms.value[overviewId] = transform
  }

  // 清除当前总览的背景
  const clearCurrentOverviewBackground = (overviewId: string) => {
    overviewBackgrounds.value[overviewId] = null
    overviewBackgroundTransforms.value[overviewId] = null
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
    overviewBackgroundTransforms,
    creatingBackground,
    canvasRef,
    setCanvas,
    getCurrentOverviewBackground,
    setCurrentOverviewBackground,
    getCurrentOverviewBackgroundTransform,
    setCurrentOverviewBackgroundTransform,
    clearCurrentOverviewBackground,
    clearBackgroundFromCanvas,
    clearBackground
  }
})