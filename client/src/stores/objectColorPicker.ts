import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useObjectColorPickerStore = defineStore('objectColorPicker', () => {
  // 对象操作专用的颜色选择器状态
  const objectColor = ref('#FFD152')

  // 设置选中颜色
  const setObjectColor = (color: string) => {
    objectColor.value = color
  }

  return {
    objectColor,
    setObjectColor
  }
}) 