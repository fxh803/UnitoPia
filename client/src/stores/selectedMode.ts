import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Canvas } from 'fabric'
import { useCollageSeriesStore } from '~/stores/collageSeries'

export const useSelectedModeStore = defineStore('selectedMode', () => {
    // 颜色选择器状态
    const selectedMode = ref<'container' | 'emitter' | 'force' | null>('container')
    const canvasRef = ref<(() => Canvas | null) | null>(null)
    const collageSeriesStore = useCollageSeriesStore()

    // 设置canvas引用
    function setCanvas(canvas: () => Canvas | null) {
        canvasRef.value = canvas
    }

    // 处理模式切换时的对象透明度
    function handleModeSwitch(newMode: 'container' | 'emitter' | 'force' | null) {
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return

        const objects = canvasInstance.getObjects()
        // 从当前 slide 的持久化数据里取“基础透明度”（用于恢复 marker）
        const currentSlide =
            collageSeriesStore.overviews?.[collageSeriesStore.currentOverviewIndex]?.collageSeries?.[
                collageSeriesStore.currentSlideIndex
            ]
        const origOpacityArray: number[] = currentSlide?.origOpacityArray || []
        
        objects.forEach((obj: any, index: number) => {
            // 擦除路径依赖不透明笔触 + destination-out，勿改 opacity
            if (obj.get('isErasePath')) return

            // 根据对象类型设置透明度
            const objType = obj.get('dataType')
            
            if (newMode === null) {
                if (objType === 'marker') {
                    // 恢复 marker 的原始透明度：优先用对象上已有的 _origOpacity，
                    // 否则使用 collageSeries.ts 记录的 origOpacityArray（按对象顺序匹配）。
                    const fromObj = typeof obj._origOpacity === 'number' ? obj._origOpacity : undefined
                    const fromRecord = origOpacityArray[index]
                    const baseOpacity = fromObj ?? fromRecord
                    obj.set('opacity', typeof baseOpacity === 'number' ? baseOpacity : 1)
                }
                else {
                    obj.set('opacity', 1)
                }
            } else if (objType === newMode) {// 当前对象属于当前模式
                obj.set('opacity', 1)
            } else if (objType && objType !== newMode) {//当前对象不属于当前模式
                if (objType === 'background') {
                    obj.set('opacity', 1)
                }
                else if (objType === 'marker') {
                    // 第一次降到 0.5 前记住基础透明度，确保之后可以恢复
                    if (obj._origOpacity == null) {
                        obj._origOpacity = obj.opacity ?? 1
                    }
                    obj.set('opacity', 0.5)
                }
                 else {
                    obj.set('opacity', 0.5)
                }
            }
        })
        
        canvasInstance.renderAll()
    }

    const setSelectedMode = (mode: 'container' | 'emitter' | 'force' | null) => {
        // 如果点击的是当前已选中的模式，则取消选择（设为null）
        if (selectedMode.value === mode) {
            selectedMode.value = null
        } else {
            selectedMode.value = mode
        }
        // 处理模式切换
        handleModeSwitch(selectedMode.value)
    }

    return {
        selectedMode,
        setSelectedMode,
        setCanvas,
        handleModeSwitch
    }
})  