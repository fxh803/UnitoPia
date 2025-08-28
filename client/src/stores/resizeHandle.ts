import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResizeHandleStore = defineStore('resizeHandle', () => {
  // 左侧容器的宽度
  const leftWidth = ref(300)
  
  // 是否正在拖动
  const isDragging = ref(false)
  
  // 更新左侧宽度
  function updateLeftWidth(width: number) {
    leftWidth.value = width
  }
  
  // 设置拖动状态
  function setDragging(dragging: boolean) {
    isDragging.value = dragging
  }
  

  
  return {
    leftWidth,
    isDragging,
    updateLeftWidth,
    setDragging
  }
})
