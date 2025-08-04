import { defineStore } from 'pinia' 
import type { Canvas } from 'fabric'
import { Group, ActiveSelection } from 'fabric'
import { ref, computed } from 'vue'
import { useSelectedModeStore } from '~/stores/selectedMode'
const selectedModeStore = useSelectedModeStore()
export const useObjectActionsStore = defineStore('objectActions', () => {
    const canvasRef = ref<(() => Canvas | null) | null>(null)
    const showDeleteBtn = ref(false)
    const deleteBtnPosition = ref({ top: '0px', left: '0px' })
    const showClosePathBtn = ref(false)
    const closePathBtnPosition = ref({ top: '0px', left: '0px' })
    const showGroupBtn = ref(false)
    const groupBtnPosition = ref({ top: '0px', left: '0px' })
    const currentPathObj = ref<any>(null)
    // 设置 canvas 引用
    function setCanvas(canvas: () => Canvas | null) {
        canvasRef.value = canvas
    }
    function updateDeleteBtnPosition() {
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

    function updateGroupBtnPosition() {
        const canvasInstance = canvasRef.value?.()
        const activeObject = canvasInstance?.getActiveObject()
        if (!activeObject) {
            showGroupBtn.value = false
            return
        }

        // 检查是否为组对象（拆分组）或多选对象（分组）
        const isGroup = activeObject.type === 'group'
        const objects = activeObject.getObjects ? activeObject.getObjects() : [activeObject]
        const isMultipleSelection = objects.length > 1

        if (!isGroup && !isMultipleSelection) {
            showGroupBtn.value = false
            return
        }

        // 获取画布的变换信息
        const zoom = canvasInstance.getZoom()
        const vpt = canvasInstance.viewportTransform

        // 计算选择框的左上角位置
        const tl = activeObject.aCoords.tl
        const btnOffsetX = -60
        const btnOffsetY = 20

        // 应用画布变换
        const x = (tl.x * zoom) + (vpt[4] || 0)
        const y = (tl.y * zoom) + (vpt[5] || 0)

        groupBtnPosition.value = {
            top: `${y - btnOffsetY}px`,
            left: `${x + btnOffsetX}px`,
        }
        showGroupBtn.value = true
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

    function toggleGroup() {
        const canvasInstance = canvasRef.value?.()
        const activeObject = canvasInstance?.getActiveObject()
        if (!activeObject || !canvasInstance) return

                // 检查是否为组对象（拆分组）
        if (activeObject.type === 'group') {
            // 使用removeAll()方法获取组中的所有对象并移除它们
            const objects = activeObject.removeAll()
            console.log('objects', objects)
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
        }else {
            // 分组：检查是否为多选对象
            if (activeObject.isType && activeObject.isType('activeselection')) {
                // 获取所有选中的对象
                const objects = activeObject.getObjects() 
                
                // 从画布中移除原始对象
                canvasInstance.remove(...objects)
                
                // 创建新的组，使用原始对象
                const group = new Group(objects, {
                    dataType: selectedModeStore.selectedMode
                })
                
                // 将组添加到画布
                canvasInstance.add(group)
                canvasInstance.setActiveObject(group)
                canvasInstance.requestRenderAll()
                
                // 触发object:modified事件
                canvasInstance.fire('object:modified', { target: group })
            }
        }
    }

    function hideBtns() {
        showDeleteBtn.value = false
        showClosePathBtn.value = false
        showGroupBtn.value = false
        currentPathObj.value = null
    }

    return {
        showDeleteBtn,
        deleteBtnPosition,
        showClosePathBtn,
        closePathBtnPosition,
        showGroupBtn,
        groupBtnPosition,
        currentPathObj,
        updateDeleteBtnPosition,
        deleteActiveObject,
        updateClosePathBtnPosition,
        updateGroupBtnPosition,
        isPathClosed,
        togglePathClosed,
        toggleGroup,
        hideBtns,
        setCanvas
    }
}) 