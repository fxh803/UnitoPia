import { defineStore } from 'pinia'

export const useCollageStore = defineStore('collage', () => {
    const collageId = ref('')
    const progressTimer = ref(null)
    return {
        collageId,
        progressTimer
    }
}) 