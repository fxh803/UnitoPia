import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCollageStore = defineStore('collage', () => {
    const collageId = ref('')
    const progressTimer = ref(null)
    const collaging = ref(false)
    const progress = ref(null)
    const result = ref([])
    // 开始拼贴处理
    const startCollaging = () => {
        collaging.value = true
    }
    
    // 停止拼贴处理
    const stopCollaging = () => {
        collaging.value = false
    }
    
    return {
        collageId,
        progressTimer,
        collaging,
        progress,
        result,
        startCollaging,
        stopCollaging
    }
}) 