import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useColorPickerStore = defineStore('colorpicker', () => {
  // 颜色选择器状态
  const selectedColor = ref('#FFD152')

  // 设置选中颜色
  const setSelectedColor = (color: string) => {
    selectedColor.value = color
  }

  return {
    selectedColor,
    setSelectedColor
  }
}) 