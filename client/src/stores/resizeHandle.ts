import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResizeHandleStore = defineStore('resizeHandle', () => {
  // 右侧画布区宽度
  const rightWidth = ref(640)
  
  // 是否正在拖动
  const isDragging = ref(false)
  
  // 更新右侧宽度
  function updateRightWidth(width: number) {
    rightWidth.value = width
  }
  
  // 设置拖动状态
  function setDragging(dragging: boolean) {
    isDragging.value = dragging
  }
  

  
  return {
    rightWidth,
    isDragging,
    updateRightWidth,
    setDragging
  }
})
