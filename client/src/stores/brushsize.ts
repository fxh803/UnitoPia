import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBrushSizeStore = defineStore('brushSize', () => {
    // 画笔大小状态
    const brushWidth = ref(6)

    return {
        brushWidth
    }
}) 