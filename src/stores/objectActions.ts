import { defineStore } from 'pinia' 
import type { Canvas } from 'fabric'
import { ref, computed } from 'vue'

export const useObjectActionsStore = defineStore('objectActions', () => {
    const canvasRef = ref<(() => Canvas | null) | null>(null)
    const showDeleteBtn = ref(false)
    const deleteBtnPosition = ref({ top: '0px', left: '0px' })
    const showClosePathBtn = ref(false)
    const closePathBtnPosition = ref({ top: '0px', left: '0px' })
    const currentPathObj = ref<any>(null)
    // 设置 canvas 引用
    function setCanvas(canvas: () => Canvas | null) {
        canvasRef.value = canvas
    }
    function updateDeleteBtnPosition() {
        console.log('updateDeleteBtnPosition')
        const canvasInstance = canvasRef.value?.()
        const obj = canvasInstance?.getActiveObject()
        if (!obj) {
            showDeleteBtn.value = false
            return
        }

        // 获取画布的变换信息
        const zoom = canvasInstance.getZoom()
        const vpt = canvasInstance.viewportTransform

        // 计算对象在画布容器中的实际位置
        const tr = obj.aCoords.tr
        const btnOffsetX = 20
        const btnOffsetY = 20

        // 应用画布变换
        const x = (tr.x * zoom) + (vpt[4] || 0)
        const y = (tr.y * zoom) + (vpt[5] || 0)

        deleteBtnPosition.value = {
            top: `${y - btnOffsetY}px`,
            left: `${x + btnOffsetX}px`,
        }
        showDeleteBtn.value = true
    }

    function deleteActiveObject() {
        const canvasInstance = canvasRef.value?.()
        const obj = canvasInstance?.getActiveObject()
        if (obj && canvasInstance) {
            canvasInstance.remove(obj)
            canvasInstance.discardActiveObject()
            canvasInstance.renderAll()
        }
    }

    function updateClosePathBtnPosition() {
        console.log('updateClosePathBtnPosition')
        const canvasInstance = canvasRef.value?.()
        const obj = canvasInstance?.getActiveObject()
        currentPathObj.value = obj
        if (!obj) {
            showClosePathBtn.value = false
            return
        }

        // 获取画布的变换信息
        const zoom = canvasInstance.getZoom()
        const vpt = canvasInstance.viewportTransform

        // 计算对象在画布容器中的实际位置
        const tr = obj.aCoords.tr
        const btnOffsetX = -20
        const btnOffsetY = 20

        // 应用画布变换
        const x = (tr.x * zoom) + (vpt[4] || 0)
        const y = (tr.y * zoom) + (vpt[5] || 0)

        closePathBtnPosition.value = {
            top: `${y - btnOffsetY}px`,
            left: `${x + btnOffsetX}px`,
        }
        showClosePathBtn.value = true
    }

    const isPathClosed = computed(() => {
        const obj = currentPathObj.value
        return !!(obj && obj.fill && obj.fill !== 'transparent' && obj.fill !== 'rgba(0,0,0,0)')
    })

    function togglePathClosed() {
        if (!currentPathObj.value) return
        const canvasInstance = canvasRef.value?.()
        if (!isPathClosed.value) {
            const strokeColor = currentPathObj.value.stroke || '#000'
            currentPathObj.value.set('fill', strokeColor)
        } else {
            currentPathObj.value.set('fill', null)
        }
        canvasInstance?.requestRenderAll()
        // 触发object:modified事件，让slide能够检测到变化
        canvasInstance?.fire('object:modified', { target: currentPathObj.value })
    }

    function hideBtns() {
        showDeleteBtn.value = false
        showClosePathBtn.value = false
        currentPathObj.value = null
    }

    return {
        showDeleteBtn,
        deleteBtnPosition,
        showClosePathBtn,
        closePathBtnPosition,
        currentPathObj,
        updateDeleteBtnPosition,
        deleteActiveObject,
        updateClosePathBtnPosition,
        isPathClosed,
        togglePathClosed,
        hideBtns,
        setCanvas
    }

}) 