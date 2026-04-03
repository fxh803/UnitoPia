import { defineStore } from 'pinia'
import type { Canvas } from 'fabric'
import { Group, ActiveSelection } from 'fabric'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSelectedModeStore } from '~/stores/selectedMode'
import { useForceDrawingStore } from '~/stores/forceDrawing'
import { useAnimationStore } from '~/stores/animation'
export const useObjectActionsStore = defineStore('objectActions', () => {
    const animationStore = useAnimationStore()
    const { collaging } = storeToRefs(animationStore)
    const selectedModeStore = useSelectedModeStore()
    const forceDrawingStore = useForceDrawingStore()
    const canvasRef = ref<(() => Canvas | null) | null>(null)
    const showDeleteBtn = ref(false)
    const actionBtnPosition = ref({ top: '0px', left: '0px' })
    const showClosePathBtn = ref(false)
    const showGroupBtn = ref(false)
    const showScaleUpBtn = ref(false)
    const showScaleDownBtn = ref(false)
    const currentPathObj = ref<any>(null) //如果是需要响应式，则需要使用currentPathObj.value，如果只是画布操作，直接canvas.activeObject()
    // 设置 canvas 引用
    function setCanvas(canvas: () => Canvas | null) {
        canvasRef.value = canvas
    }
    const isPathClosed = computed(() => {
        const obj = currentPathObj.value
        return !!(obj && obj.fill && obj.fill !== 'transparent' && obj.fill !== 'rgba(0,0,0,0)')
    })
    const isGroupMode = computed(() => {
        const obj = currentPathObj.value
        return !!(obj && obj.type === 'group')
    })

    const isMultipleSelection = computed(() => {
        const obj = currentPathObj.value
        return !!(obj && obj.type === 'activeselection')
    })

    /** 当前选中是否允许 marker 缩放：单体 marker，或多选且子项全部为 marker */
    const showMarkerScale = computed(() => {
        const obj = currentPathObj.value
        if (!obj) return false
        if ((obj as any).type === 'activeselection') {
            const objs = (obj as ActiveSelection).getObjects?.() ?? []
            return objs.length > 0 && objs.every((o: any) => o?.get?.('dataType') === 'marker')
        }
        return obj.get('dataType') === 'marker'
    })

    function setCurrentPathObj() {
        const canvasInstance = canvasRef.value?.()
        const obj = canvasInstance?.getActiveObject()
        currentPathObj.value = obj
    }
    function updateActionBtnVisble() {
        showDeleteBtn.value = true
        showClosePathBtn.value = true
        showGroupBtn.value = true
        showScaleUpBtn.value = false
        showScaleDownBtn.value = false
        if (!currentPathObj.value) {
            showDeleteBtn.value = false
            showClosePathBtn.value = false
            showGroupBtn.value = false
            showScaleUpBtn.value = false
            showScaleDownBtn.value = false
        }
        if (isGroupMode.value || isMultipleSelection.value) {
            showClosePathBtn.value = false
        }
        if (!isGroupMode.value && !isMultipleSelection.value) {
            showGroupBtn.value = false
        }
        if(selectedModeStore.selectedMode === 'emitter') {
            showClosePathBtn.value = false
            showGroupBtn.value = false
        }
        if(selectedModeStore.selectedMode === 'force') {
            showClosePathBtn.value = false
            showGroupBtn.value = false
            if(forceDrawingStore.forceType === 'fieldForce') {
                showDeleteBtn.value = false
            }
        }
        if (currentPathObj.value && showMarkerScale.value) {
            showClosePathBtn.value = false
            showGroupBtn.value = false
            showScaleUpBtn.value = true
            showScaleDownBtn.value = true
        }
        if(collaging.value) {
            showDeleteBtn.value = false
            showClosePathBtn.value = false
            showGroupBtn.value = false
            showScaleUpBtn.value = false
            showScaleDownBtn.value = false
        }
    }
    function updateActionBtnPosition() {
        const canvasInstance = canvasRef.value?.()
        if (!currentPathObj.value || !canvasInstance) {
            return
        }
        // 获取画布的变换信息
        const zoom = canvasInstance.getZoom()
        const vpt = canvasInstance.viewportTransform

        // 计算对象在画布容器中的实际位置
        const tr = currentPathObj.value.aCoords.tr
        const btnOffsetX = 20
        const btnOffsetY = 20

        // 应用画布变换
        const x = (tr.x * zoom) + (vpt[4] || 0)
        const y = (tr.y * zoom) + (vpt[5] || 0)

        actionBtnPosition.value = {
            top: `${y - btnOffsetY}px`,
            left: `${x + btnOffsetX}px`,
        }
    }
    function deleteActiveObject() {
        const canvasInstance = canvasRef.value?.()
        const obj = canvasInstance?.getActiveObject()
        if (!canvasInstance) return
        if (isMultipleSelection.value && obj) {
            const objects = (obj as Group).getObjects()
            canvasInstance.remove(...objects)
            canvasInstance.discardActiveObject()
            canvasInstance.renderAll()
        } else if (obj) {
            canvasInstance.remove(obj)
            canvasInstance.discardActiveObject()
            canvasInstance.renderAll()
        }
    }
    function togglePathClosed() {
        if (!currentPathObj.value) return
        const canvasInstance = canvasRef.value?.()
        if (!isPathClosed.value) {
            const strokeColor = currentPathObj.value.stroke || '#000'
            currentPathObj.value.set('fill', strokeColor)
            currentPathObj.value.set('stroke', 'rgba(0,0,0,0)')
        } else {
            currentPathObj.value.set('stroke', currentPathObj.value.fill)
            currentPathObj.value.set('fill', null)
        }
        canvasInstance?.requestRenderAll()
        // 触发object:modified事件，让slide能够检测到变化
        canvasInstance?.fire('object:modified', { target: currentPathObj.value })
    }
    function toggleGroup() {
        const canvasInstance = canvasRef.value?.()
        const activeObject = canvasInstance?.getActiveObject()
        if (!activeObject || !canvasInstance) return

        // 检查是否为组对象（拆分组）
        if (isGroupMode.value) {
            // 使用removeAll()方法获取组中的所有对象并移除它们
            const objects = (activeObject as Group).removeAll()
            // 将对象重新添加到画布
            canvasInstance.add(...objects)

            // 从画布中移除组对象
            canvasInstance.remove(activeObject)

            // 创建ActiveSelection，保持多选状态
            const activeSelection = new ActiveSelection(objects, {
                canvas: canvasInstance
            })

            // 设置为活动对象
            canvasInstance.setActiveObject(activeSelection)
            canvasInstance.requestRenderAll()
        } else {
            // 分组：检查是否为多选对象
            if (isMultipleSelection.value) {
                // 获取所有选中的对象
                const objects = (activeObject as Group).getObjects()

                // 从画布中移除原始对象
                canvasInstance.remove(...objects)

                // 创建新的组，使用原始对象
                const group = new Group(objects, {
                    dataType: selectedModeStore.selectedMode
                } as any)
                // 将组添加到画布
                canvasInstance.add(group)
                canvasInstance.setActiveObject(group)
                canvasInstance.requestRenderAll()
            }
        }
    }

    function scaleActiveObject(scaleFactor: number) {
        const canvasInstance = canvasRef.value?.()
        const activeObject = canvasInstance?.getActiveObject()
        if (!canvasInstance || !activeObject) return

        // 多选：对选区内每个对象围绕选区中心缩放（保证取消选择后大小也真正变更）
        if ((activeObject as any).type === 'activeselection') {
            const selection = activeObject as unknown as ActiveSelection
            const objects = (selection as any).getObjects?.() as any[] | undefined
            if (!objects?.length) return

            // 轮询选中的对象逐个缩放（不改变位置），并且只缩放 marker
            objects.forEach((obj) => {
                if (obj?.get?.('dataType') !== 'marker') return
                const nextScaleX = Math.min(Math.max((obj as any).scaleX * scaleFactor, 0.05), 20)
                const nextScaleY = Math.min(Math.max((obj as any).scaleY * scaleFactor, 0.05), 20)
                obj.set('scaleX', nextScaleX)
                obj.set('scaleY', nextScaleY)
                obj.setCoords?.()
            })

            canvasInstance.requestRenderAll()
            // 只触发一次，避免 selection 内每个对象都触发导致卡顿
            canvasInstance.fire('object:modified', { target: activeObject as any })
            return
        }

        // 单体：直接改 scale
        const nextScaleX = Math.min(Math.max((activeObject as any).scaleX * scaleFactor, 0.05), 20)
        const nextScaleY = Math.min(Math.max((activeObject as any).scaleY * scaleFactor, 0.05), 20)
        ;(activeObject as any).set('scaleX', nextScaleX)
        ;(activeObject as any).set('scaleY', nextScaleY)
        ;(activeObject as any).setCoords?.()
        canvasInstance.requestRenderAll()
        canvasInstance.fire('object:modified', { target: activeObject as any })
    }

    function scaleUpMarker() {
        scaleActiveObject(1.1)
    }

    function scaleDownMarker() {
        scaleActiveObject(1 / 1.1)
    }

    function hideBtns() {
        showDeleteBtn.value = false
        showClosePathBtn.value = false
        showGroupBtn.value = false
        showScaleUpBtn.value = false
        showScaleDownBtn.value = false
    }

    return {
        showDeleteBtn,
        showClosePathBtn,
        showGroupBtn,
        showScaleUpBtn,
        showScaleDownBtn,
        actionBtnPosition,
        isGroupMode,
        isMultipleSelection,
        isPathClosed,
        showMarkerScale,
        updateActionBtnVisble,
        updateActionBtnPosition,
        deleteActiveObject,
        togglePathClosed,
        toggleGroup,
        scaleUpMarker,
        scaleDownMarker,
        hideBtns,
        setCanvas,
        setCurrentPathObj
    }
})
