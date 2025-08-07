import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Canvas } from 'fabric'
import { useOverviewStore } from '~/stores/overview'

export const useCollageSeriesStore = defineStore('collageSeries', () => {
    // 拼贴系列状态
    const collageSeries = ref<{ json: string, preview: string }[]>([])
    const currentSlideIndex = ref(0)
    const stopListen = ref(false) // 添加标志
    const canvasRef = ref<(() => Canvas | null) | null>(null)
    const overviewStore = useOverviewStore()

    // 设置 canvas 引用
    function setCanvas(canvas: () => Canvas | null) {
        canvasRef.value = canvas
    }

    // 初始化一个空白幻灯片
    function initializeEmptySlide() { 
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return

        const json = JSON.stringify(canvasInstance.toJSON())
        const preview = canvasInstance.toDataURL({
            format: 'png',
            multiplier: 2
        })
        collageSeries.value = [{ json, preview }]
        currentSlideIndex.value = 0
    }

    // 更新当前幻灯片
    function updateCurrentSlide() { 
        if (stopListen.value) return // 如果是幻灯片操作，不更新

        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance || collageSeries.value.length === 0) return

        // 临时保存所有对象的原始透明度
        const originalOpacities = new Map()
        canvasInstance.getObjects().forEach((obj: any) => {
            originalOpacities.set(obj, obj.opacity)
            obj.set('opacity', 1)
        })

        const json = JSON.stringify(canvasInstance.toJSON())
        const preview = canvasInstance.toDataURL({
            format: 'png',
            multiplier: 2
        })

        // 恢复所有对象的原始透明度
        canvasInstance.getObjects().forEach((obj: any) => {
            const originalOpacity = originalOpacities.get(obj)
            if (originalOpacity !== undefined) {
                obj.set('opacity', originalOpacity)
            }
        })

        collageSeries.value[currentSlideIndex.value] = { json, preview }
    }

    // 清空画布
    function clearCanvas() { 
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return

        const objects = canvasInstance.getObjects().concat() 
        if(objects.length > 0){
            objects.forEach(obj => canvasInstance.remove(obj))
        }
    }

    // 添加新幻灯片
    function addNewSlide() { 
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return
        stopListen.value = true
        // 清空画布
        clearCanvas()
        
        // 创建新的空白幻灯片
        const json = JSON.stringify(canvasInstance.toJSON())
        const preview = canvasInstance.toDataURL({
            format: 'png',
            multiplier: 2
        })
        collageSeries.value.push({ json, preview })
        currentSlideIndex.value = collageSeries.value.length - 1
        stopListen.value = false
        overviewStore.updateMarkerObjects()
    }

    // 选择幻灯片
    function handleCollageSeriesSelect(idx: number) { 
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance || !collageSeries.value[idx]) return
        stopListen.value = true
        currentSlideIndex.value = idx
        const json = collageSeries.value[idx].json
        const jsonObj = typeof json === 'string' ? JSON.parse(json) : json
         
        // 清空当前画布
        clearCanvas()
        if(jsonObj.objects.length > 0){
            canvasInstance.loadFromJSON(json, () => {
                setTimeout(() => {
                    if (canvasInstance) {
                        canvasInstance.renderAll()
                    }
                    stopListen.value = false
                }, 100)
            })
        }else{
            stopListen.value = false
        }
        overviewStore.updateMarkerObjects()
    }

    // 删除幻灯片
    function handleDeleteCollageSeries(idx: number) { 
        if (collageSeries.value.length <= 1) return // 至少保留一个幻灯片

        // 如果删除的是当前幻灯片 
        if (idx === currentSlideIndex.value) {
            currentSlideIndex.value = Math.max(0, idx - 1)
            handleCollageSeriesSelect(currentSlideIndex.value)
        } else if(idx < currentSlideIndex.value){
            currentSlideIndex.value -= 1
        }
        collageSeries.value.splice(idx, 1)
        overviewStore.updateMarkerObjects()
    }

    // 监听画布变化，自动更新当前幻灯片
    function setupCanvasChangeListener() { 
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return

        canvasInstance.on('object:added', updateCurrentSlide)
        canvasInstance.on('object:modified', updateCurrentSlide)
        canvasInstance.on('object:removed', updateCurrentSlide)
        canvasInstance.on('object:updated', updateCurrentSlide)
    }

    return {
        collageSeries,
        currentSlideIndex,
        stopListen,
        setCanvas,
        initializeEmptySlide,
        updateCurrentSlide,
        addNewSlide,
        handleCollageSeriesSelect,
        handleDeleteCollageSeries,
        setupCanvasChangeListener,
    }
}) 