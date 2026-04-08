import { defineStore } from 'pinia'
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

  const clearBackground = (overviewId?: string) => {
    if (overviewId) {
      clearCurrentOverviewBackground(overviewId)
    }
  }

  return {
    overviewBackgrounds,
    overviewBackgroundTransforms,
    creatingBackground,
    getCurrentOverviewBackground,
    setCurrentOverviewBackground,
    getCurrentOverviewBackgroundTransform,
    setCurrentOverviewBackgroundTransform,
    clearCurrentOverviewBackground,
    clearBackground
  }
})