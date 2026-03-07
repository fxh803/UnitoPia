import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 用于 Export：paperCanvas 挂载时注册、卸载时清空，Header 导出时读取 */
export const usePaperExportStore = defineStore('paperExport', () => {
  const paperCanvasEl = ref<HTMLCanvasElement | null>(null)

  function setPaperCanvasEl(el: HTMLCanvasElement | null) {
    paperCanvasEl.value = el
  }

  return { paperCanvasEl, setPaperCanvasEl }
})
