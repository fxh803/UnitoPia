import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Canvas } from 'fabric'
import { useMarkerCanvasModeStore } from '~/stores/markerCanvasMode'
import { useMarkerObjectActionsStore } from '~/stores/markerObjectActions'
import { useMarkInstanceStore } from '~/stores/markInstance'
import * as fabric from 'fabric'
export const useMarkerCanvasStore = defineStore('markerCanvas', () => {
  const canvasRef = ref<(() => Canvas | null) | null>(null)

  // 路径闭合确认对话框状态
  const closePathConfirm = ref<{
    show: boolean
    path: fabric.FabricObject | null
    position: { x: number; y: number }
  }>({
    show: false,
    path: null,
    position: { x: 0, y: 0 }
  })

  // 是否暂时抑制路径闭合确认（例如从 JSON 批量恢复画布时）
  const suppressClosePath = ref(false)

  // 设置 canvas 引用
  function setCanvas(canvas: () => Canvas | null) {
    canvasRef.value = canvas
  }

  function setSuppressClosePath(value: boolean) {
    suppressClosePath.value = value
  }

  // 添加画布事件监听器
  function addMarkerCanvasEventListeners() {
    const canvasInstance = canvasRef.value?.()
    if (!canvasInstance) return

    // 在函数内导入 store，避免循环依赖
    const markerCanvasModeStore = useMarkerCanvasModeStore()
    const markerObjectActionsStore = useMarkerObjectActionsStore()
    const markInstanceStore = useMarkInstanceStore()

    // 对保存做一个简单防抖，避免连续频繁操作时重复生成缩略图
    let saveTimer: number | null = null

    async function saveCurrentMarker() {
      const canvas = canvasRef.value?.()
      if (!canvas) return

      const sel = markInstanceStore.selectedMarkForDetail
      if (!sel) {
        return
      }

      const allObjects = canvas.getObjects()

      // 画布上已经没有任何对象了：把当前 mark 恢复为默认（无图案）
      if (!allObjects.length) {
        if (sel.type === 'singleInstance') {
          markInstanceStore.updateMarkInstance(sel.markId, {
            markerThumbnail: null,
            markerJsonData: [],
          })
        } else {
          const parent = markInstanceStore.markInstances.find(m => m.id === sel.parentMarkId)
          if (!parent) {
            return
          }

          const nextChildren = parent.children.map(child =>
            child.id === sel.childId
              ? {
                  ...child,
                  markerThumbnail: null,
                  markerJsonData: [],
                }
              : child,
          )

          markInstanceStore.updateMarkInstance(sel.parentMarkId, {
            children: nextChildren,
          })
        }
        return
      }

      const clonedObjects = await Promise.all(
        allObjects.map(async (obj) => obj.clone()),
      )
      const group = new fabric.Group(clonedObjects)

      const thumbnailSize = 200
      const padding = 20
      const contentSize = thumbnailSize - padding * 2

      const tempCanvasEl = document.createElement('canvas')
      tempCanvasEl.width = thumbnailSize
      tempCanvasEl.height = thumbnailSize

      const tempFabricCanvas = new fabric.Canvas(tempCanvasEl, {
        width: thumbnailSize,
        height: thumbnailSize,
        backgroundColor: '#fffef8',
      })

      const originWidth = group.width || 1
      const originHeight = group.height || 1

      const scaleX = contentSize / originWidth
      const scaleY = contentSize / originHeight
      const scale = Math.min(scaleX, scaleY, 1)

      group.set('left', thumbnailSize / 2)
      group.set('top', thumbnailSize / 2)
      group.set('scaleX', scale)
      group.set('scaleY', scale)
      group.set('originX', 'center')
      group.set('originY', 'center')
      group.set('opacity', 1)

      tempFabricCanvas.add(group)
      tempFabricCanvas.renderAll()

      const thumbnail = tempFabricCanvas.toDataURL({
        format: 'png',
        multiplier: 2,
        enableRetinaScaling: false as any,
      })

      const jsonData = allObjects.map(obj => obj.toJSON())

      if (sel.type === 'singleInstance') {
        markInstanceStore.updateMarkInstance(sel.markId, {
          markerThumbnail: thumbnail,
          markerJsonData: jsonData,
        })
      } else {
        const parent = markInstanceStore.markInstances.find(m => m.id === sel.parentMarkId)
        if (!parent) {
          tempFabricCanvas.dispose()
          return
        }

        const nextChildren = parent.children.map(child =>
          child.id === sel.childId
            ? {
                ...child,
                markerThumbnail: thumbnail,
                markerJsonData: jsonData,
              }
            : child,
        )

        markInstanceStore.updateMarkInstance(sel.parentMarkId, {
          children: nextChildren,
        })
      }

      tempFabricCanvas.dispose()
    }

    function scheduleSave() {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer)
      }
      saveTimer = window.setTimeout(() => {
        saveCurrentMarker()
      }, 100)
    }

    canvasInstance.on({
      'object:added': (e) => {
        if (e.target && markerCanvasModeStore.mode === 'erase') {
          // 擦除在对象真正加入画布后设置为抠除合成
          e.target.set('globalCompositeOperation', 'destination-out')
          e.target.set('opacity', 1)
        }

        // 确保新添加的对象不可选（除非当前模式是 move）
        // 如果当前模式是 move，会根据对象类型在 markerCanvasModeStore.setMode 中设置
        if (markerCanvasModeStore.mode !== 'move') {
          e.target.set('selectable', false)
          e.target.set('evented', false)
        }

        // 询问是否闭合路径
        askToClosePath(e.target)
        scheduleSave()
      },
      'selection:created': () => {
        markerObjectActionsStore.setCurrentPathObj()
        markerObjectActionsStore.updateActionBtnVisble()
        markerObjectActionsStore.updateActionBtnPosition()
      },
      'selection:updated': () => {
        markerObjectActionsStore.setCurrentPathObj()
        markerObjectActionsStore.updateActionBtnVisble()
        markerObjectActionsStore.updateActionBtnPosition()
      },
      'selection:cleared': () => {
        markerObjectActionsStore.hideBtns()
      },
      'object:moving': () => {
        markerObjectActionsStore.hideBtns()
      },
      'object:scaling': () => {
        markerObjectActionsStore.hideBtns()
      },
      'object:rotating': () => {
        markerObjectActionsStore.hideBtns()
      },
      'object:modified': () => {
        markerObjectActionsStore.setCurrentPathObj()
        markerObjectActionsStore.updateActionBtnVisble()
        markerObjectActionsStore.updateActionBtnPosition()
        scheduleSave()
      },
      'object:removed': () => {
        scheduleSave()
      },
      'path:created': (e) => {
        if (e.path) {
          askToClosePath(e.path)
          scheduleSave()
        }
      },
    })
  }

  // 移除画布事件监听器
  function removeMarkerCanvasEventListeners() {
    const canvasInstance = canvasRef.value?.()
    if (!canvasInstance) return

    canvasInstance.off('object:added')
    canvasInstance.off('selection:created')
    canvasInstance.off('selection:updated')
    canvasInstance.off('selection:cleared')
    canvasInstance.off('object:moving')
    canvasInstance.off('object:scaling')
    canvasInstance.off('object:rotating')
    canvasInstance.off('object:modified')
  }

  // 获取路径的起点和终点
  function getPathStartAndEndPoints(path: any): { start: { x: number; y: number } | null, end: { x: number; y: number } | null } {
    if (!path || !path.path || !Array.isArray(path.path)) {
      return { start: null, end: null }
    }

    const pathData = path.path
    let startPoint: { x: number; y: number } | null = null
    let endPoint: { x: number; y: number } | null = null

    // 遍历路径段，找到起点和终点
    for (const segment of pathData) {
      if (!Array.isArray(segment) || segment.length === 0) continue

      const command = segment[0]

      if (command === 'M') {
        // 移动到点 - 这是起点
        startPoint = { x: segment[1], y: segment[2] }
      } else if (command === 'L') {
        // 直线到点 - 更新终点
        endPoint = { x: segment[1], y: segment[2] }
      } else if (command === 'Q') {
        // 二次贝塞尔曲线 - 最后一个坐标是终点
        endPoint = { x: segment[3], y: segment[4] }
      } else if (command === 'C') {
        // 三次贝塞尔曲线 - 最后一个坐标是终点
        endPoint = { x: segment[5], y: segment[6] }
      } else if (command === 'Z' || command === 'z') {
        // 闭合路径命令，终点就是起点
        if (startPoint) {
          endPoint = { ...startPoint }
        }
      }
    }

    return { start: startPoint, end: endPoint }
  }

  // 计算两点之间的距离
  function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 询问是否闭合路径
  function askToClosePath(path: any) {
    const canvasInstance = canvasRef.value?.()
    if (!canvasInstance || !path) return
    if (suppressClosePath.value) return

    // 跳过预览形状
    if (path.get('isPreview')) return

    // 只有mode为draw或rect或ellipse的状态才询问是否闭合路径
    const markerCanvasModeStore = useMarkerCanvasModeStore()
    if (markerCanvasModeStore.mode !== 'draw' && markerCanvasModeStore.mode !== 'rect' && markerCanvasModeStore.mode !== 'ellipse') return

    // 对于 draw 模式，检查起点和终点距离
    if (markerCanvasModeStore.mode === 'draw' && path.type === 'path' && path.path) {
      const { start, end } = getPathStartAndEndPoints(path)

      if (start && end) {
        // 计算起点和终点的距离
        const distance = calculateDistance(start, end)
        // 如果距离大于 50 像素，不询问是否闭合路径
        if (distance > 50) {
          return
        }
      }
    }


    // 获取对象在画布上的位置
    const zoom = canvasInstance.getZoom()
    const vpt = canvasInstance.viewportTransform
    const pathBounds = path.getBoundingRect()

    // 计算对象在页面中的位置
    const canvasEl = canvasInstance.getElement()
    if (!canvasEl) return

    const canvasRect = canvasEl.getBoundingClientRect()
    const x = (pathBounds.left * zoom) + (vpt[4] || 0) + canvasRect.left
    const y = (pathBounds.top * zoom) + (vpt[5] || 0) + canvasRect.top

    // 设置确认对话框状态
    closePathConfirm.value = {
      show: true,
      path: path,
      position: { x, y }
    }
  }

  // 处理路径闭合确认
  function handleClosePathConfirm(confirmed: boolean) {
    const { path } = closePathConfirm.value
    if (!path) return

    const canvasInstance = canvasRef.value?.()
    if (!canvasInstance) return

    if (confirmed) {
      // 闭合路径：设置 fill 为 stroke 颜色
      const strokeColor = path.stroke || '#000'
      path.set('fill', strokeColor)
      canvasInstance.requestRenderAll()
      // 触发一次 object:modified 事件，让自动保存逻辑生效
      canvasInstance.fire('object:modified', { target: path })
    }

    // 关闭确认对话框
    closePathConfirm.value = {
      show: false,
      path: null,
      position: { x: 0, y: 0 }
    }
  }

  return {
    canvasRef,
    closePathConfirm,
    setCanvas,
    addMarkerCanvasEventListeners,
    removeMarkerCanvasEventListeners,
    askToClosePath,
    handleClosePathConfirm,
    setSuppressClosePath
  }
})

