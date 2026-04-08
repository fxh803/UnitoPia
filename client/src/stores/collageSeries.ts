import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Canvas } from 'fabric'
import { useBackgroundStore } from '~/stores/background'
import type { BackgroundTransform } from '~/stores/background'

export const useCollageSeriesStore = defineStore('collageSeries', () => {
    // 总览对象类型
    interface Overview {
        overviewId: string,
        preview: string,
        width?: number,
        height?: number,
        collageSeries: {
            slideId: string,
            json: string,
            preview: string,
            dataTypeArray: any[],
            markerIdArray: any[],
            forceTypeArray: any[],
            dataArray: any[],
            // erase 绘制出来的 path（虽然 dataType 会归入 container），但 hover 时需要跳过透明度变化
            isErasePathArray?: boolean[],
        // 每个 object 的基础不透明度（用于跨 slide / 模式恢复）
        origOpacityArray?: number[],
            // 每个 slide 的个性化设置
            iterations?: number,
            rotation?: boolean,
            hole?: boolean,
            orientation?: 'free' | 'center',
            margin?: number,
            emitter_type?: string,
            isResult?: boolean
        }[]
    }

    // 总览状态
    const overviews = ref<Overview[]>([])
    const currentOverviewIndex = ref(0)
    const currentSlideIndex = ref(0)

    // 为了保持向后兼容，保留 collageSeries 作为计算属性
    const collageSeries = computed(() => {
        if (overviews.value.length === 0) return []
        return overviews.value[currentOverviewIndex.value]?.collageSeries || []
    })
    const stopListen = ref(false) // 添加标志
    const canvasRef = ref<(() => Canvas | null) | null>(null)

    /** 右侧 Visualization Gallery 面板是否收起（true=收起） */
    const isCollageSeriesPanelCollapsed = ref(true)
    function setCollageSeriesPanelCollapsed(collapsed: boolean) {
        isCollageSeriesPanelCollapsed.value = collapsed
    }

    // 生成唯一的 slide ID
    function generateSlideId(): string {
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substr(2, 9)
        return `slide-${timestamp}-${randomId}`
    }

    // 生成唯一的总览 ID
    function generateOverviewId(): string {
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substr(2, 9)
        return `overview-${timestamp}-${randomId}`
    }

    // 设置 canvas 引用
    function setCanvas(canvas: () => Canvas | null) {
        canvasRef.value = canvas
    }

    function getCurrentCanvasSize() {
        const canvasInstance = canvasRef.value?.()
        return {
            width: canvasInstance?.width || 400,
            height: canvasInstance?.height || 400,
        }
    }

    async function composeUpperWithBackground(
        upperLayerPreview: string,
        overviewBackground: string,
        tf: BackgroundTransform | null,
        baseWidth: number,
        baseHeight: number,
        multiplier: number,
    ): Promise<string> {
        const composeCanvas = document.createElement('canvas')
        composeCanvas.width = baseWidth * multiplier
        composeCanvas.height = baseHeight * multiplier
        const ctx = composeCanvas.getContext('2d')
        if (!ctx) return upperLayerPreview

        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`加载图片失败: ${src.slice(0, 64)}`))
            img.src = src
        })

        const [bgImg, upperImg] = await Promise.all([
            loadImage(overviewBackground),
            loadImage(upperLayerPreview),
        ])

        ctx.clearRect(0, 0, composeCanvas.width, composeCanvas.height)
        ctx.setTransform(multiplier, 0, 0, multiplier, 0, 0)

        const originX = tf?.originX ?? 'center'
        const originY = tf?.originY ?? 'center'
        const scaleX = tf?.scaleX ?? 1
        const scaleY = tf?.scaleY ?? 1
        const drawW = bgImg.width * scaleX
        const drawH = bgImg.height * scaleY
        let left = (tf?.left ?? baseWidth / 2)
        let top = (tf?.top ?? baseHeight / 2)
        if (originX === 'center') left -= drawW / 2
        else if (originX === 'right') left -= drawW
        if (originY === 'center') top -= drawH / 2
        else if (originY === 'bottom') top -= drawH

        // 先画背景，再画上层（含透明区域）
        ctx.drawImage(bgImg, left, top, drawW, drawH)
        ctx.drawImage(upperImg, 0, 0, baseWidth, baseHeight)
        return composeCanvas.toDataURL('image/png')
    }

    async function generateSlidePreview(
        upperLayerPreview: string,
        overviewId: string,
        baseWidth: number,
        baseHeight: number,
        multiplier: number = 2,
    ): Promise<string> {
        const backgroundStore = useBackgroundStore()
        const overviewBackground = backgroundStore.getCurrentOverviewBackground(overviewId)
        const tf = backgroundStore.getCurrentOverviewBackgroundTransform(overviewId)
        if (!overviewBackground) return upperLayerPreview

        try {
            return await composeUpperWithBackground(
                upperLayerPreview,
                overviewBackground,
                tf,
                baseWidth,
                baseHeight,
                multiplier,
            )
        } catch {
            return upperLayerPreview
        }
    }

    // 从外部快照加载 overviews（用于示例或状态恢复）
    function loadOverviewSnapshot(snapshot: Overview[] | Overview) {
        console.log('loadOverviewSnapshot', snapshot)
        stopListen.value = true
        const list = Array.isArray(snapshot) ? snapshot : [snapshot]
        // 简单深拷贝，避免外部响应式对象影响内部状态
        overviews.value = JSON.parse(JSON.stringify(list))
        currentOverviewIndex.value = 0
        currentSlideIndex.value = 0
        stopListen.value = false
    }

    // 初始化一个空白幻灯片
    function initializeEmptySlide() {
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return
        const { width, height } = getCurrentCanvasSize()

        const json = JSON.stringify(canvasInstance.toJSON())
        const preview = canvasInstance.toDataURL({
            format: 'png',
            multiplier: 2
        })
        const slideId = generateSlideId()
        const overviewId = generateOverviewId()

        // 创建第一个总览，包含一个空白幻灯片
        overviews.value = [{
            overviewId,
            preview: preview, // 初始预览就是第一个幻灯片的预览
            width,
            height,
                collageSeries: [{
                    slideId,
                    json,
                    preview,
                    dataTypeArray: [],
                    markerIdArray: [],
                    forceTypeArray: [],
                    dataArray: [],
                    origOpacityArray: [],
                    // 每个 slide 的个性化设置
                    iterations: 180,
                    rotation: true,
                    hole: false,
                    orientation: 'free',
                    margin: 0,
                    emitter_type: ''
                }]
        }]
        currentOverviewIndex.value = 0
        currentSlideIndex.value = 0
    }

    // 更新当前幻灯片
    function updateCurrentSlide() {
        if (stopListen.value) return // 如果是幻灯片操作，不更新

        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance || overviews.value.length === 0) return

        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview || currentOverview.collageSeries.length === 0) return

        // 更新当前幻灯片的预览（保持原有逻辑）
        const currentSlide = currentOverview.collageSeries[currentSlideIndex.value]

        // 临时保存所有对象用于处理透明度和自定义属性
        const objects = canvasInstance.getObjects()
        const originalOpacities = new Map<any, number | undefined>()
        objects.forEach((obj: any) => {
            originalOpacities.set(obj, obj.opacity)
            obj.opacity = 1
        })

        const json = JSON.stringify(canvasInstance.toJSON())
        const upperLayerPreview = canvasInstance.toDataURL({
            format: 'png',
            multiplier: 2
        })

        // 恢复所有对象的原始透明度
        objects.forEach((obj: any) => {
            const originalOpacity = originalOpacities.get(obj)
            if (originalOpacity !== undefined) {
                obj.set('opacity', originalOpacity)
            }
        })

        // 保存所有对象的 dataType、markerId、forceType、data 以及基础透明度
        const dataTypeArray = objects.map((obj: any) => obj.get('dataType'))
        const markerIdArray = objects.map((obj: any) => obj.get('markerId'))
        const forceTypeArray = objects.map((obj: any) => obj.get('forceType'))
        const dataArray = objects.map((obj: any) => obj.get('data'))
        const isErasePathArray = objects.map((obj: any) => Boolean(obj.get('isErasePath')))
        const origOpacityArray = objects.map((obj: any) => {
            // 如果有自定义的 _origOpacity，则优先使用，否则使用当前不透明度
            if (typeof obj._origOpacity === 'number') return obj._origOpacity
            const current = obj.opacity
            return typeof current === 'number' ? current : 1
        })
        // console.log(dataTypeArray, markerIdArray, forceTypeArray, dataArray)

        currentSlide.json = json
        currentSlide.dataTypeArray = dataTypeArray
        currentSlide.markerIdArray = markerIdArray
        currentSlide.forceTypeArray = forceTypeArray
        currentSlide.dataArray = dataArray
        currentSlide.isErasePathArray = isErasePathArray
        currentSlide.origOpacityArray = origOpacityArray
        generateSlidePreview(
            upperLayerPreview,
            currentOverview.overviewId,
            canvasInstance.width || 400,
            canvasInstance.height || 400,
            2,
        ).then((preview) => {
            currentSlide.preview = preview
            // 生成总览的预览（合并所有幻灯片）
            generateOverviewPreview()
        })
    }

    // 生成总览预览
    async function generateOverviewPreview() {
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance || overviews.value.length === 0) return

        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview || currentOverview.collageSeries.length === 0) return

        // 检查是否存在结果 slide（isResult 为 true）
        const resultSlide = currentOverview.collageSeries.find((slide: any) => slide.isResult === true)
        if (resultSlide && resultSlide.preview) {
            // 如果存在结果 slide，直接使用它的 preview
            currentOverview.preview = resultSlide.preview
            return
        }

        // 合并当前总览下所有幻灯片的 JSON 对象
        const mergedObjects: any[] = []

        // 遍历所有幻灯片，合并它们的对象
        currentOverview.collageSeries.forEach((slide, slideIndex) => {
            try {
                const slideData = typeof slide.json === 'string' ? JSON.parse(slide.json) : slide.json
                if (slideData.objects && Array.isArray(slideData.objects)) {
                    // 为每个对象添加来源信息
                    slideData.objects.forEach((obj: any) => {
                        const mergedObj = {
                            ...obj,
                        }
                        mergedObjects.push(mergedObj)
                    })
                }
            } catch (error) {
                console.error(`解析幻灯片 ${slideIndex} 的 JSON 时出错:`, error)
            }
        })

        // 创建合并后的 JSON 数据
        const mergedJsonData = {
            version: "5.3.0",
            objects: mergedObjects,
            background: "",
            backgroundImage: null,
            backgroundImageOpacity: 1,
            backgroundImageStretch: false,
            width: canvasInstance.width || 400,
            height: canvasInstance.height || 400,
            originX: "left",
            originY: "top",
            clipPath: null
        }

        // 创建临时画布来生成总览预览
        const tempCanvas = new Canvas(document.createElement('canvas'), {
            width: canvasInstance.width || 400,
            height: canvasInstance.height || 400
        })

        try {
            // 加载合并后的数据到临时画布
            await tempCanvas.loadFromJSON(mergedJsonData)
            tempCanvas.renderAll()

            // 先导出上层（无背景）图，再与背景进行分层合成，避免 destination-out 把背景也抠除
            const upperLayerPreview = tempCanvas.toDataURL({
                format: 'png',
                multiplier: 2
            })
            const backgroundStore = useBackgroundStore()
            const overviewBackground = backgroundStore.getCurrentOverviewBackground(currentOverview.overviewId)
            const tf = backgroundStore.getCurrentOverviewBackgroundTransform(currentOverview.overviewId)

            let overviewPreview = upperLayerPreview
            if (overviewBackground) {
                const baseWidth = canvasInstance.width || 400
                const baseHeight = canvasInstance.height || 400
                const multiplier = 2
                overviewPreview = await composeUpperWithBackground(
                    upperLayerPreview,
                    overviewBackground,
                    tf,
                    baseWidth,
                    baseHeight,
                    multiplier,
                )
            }

            // 将预览保存到总览对象中
            currentOverview.preview = overviewPreview

            // 清理临时画布
            tempCanvas.dispose()
        } catch (error) {
            console.error('生成总览预览时出错:', error)
            tempCanvas.dispose()
        }
    }

    // 清空画布
    function clearCanvas() {
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return

        const objects = canvasInstance.getObjects().concat()
        if (objects.length > 0) {
            objects.forEach(obj => canvasInstance.remove(obj))
        }
    }

    // 添加新幻灯片
    async function addNewSlide(isResult: boolean = false) {
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance || overviews.value.length === 0) return
        stopListen.value = true

        // 获取当前总览
        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview) {
            stopListen.value = false
            return
        }

        // 清空画布
        clearCanvas()

        // 创建新的空白幻灯片
        let json = JSON.stringify(canvasInstance.toJSON())
        let preview: string
        let dataTypeArray: any[] = []
        let markerIdArray: any[] = []
        let forceTypeArray: any[] = []
        let dataArray: any[] = []
        let isErasePathArray: boolean[] = []

        // 背景迁移到静态底层 canvas，thumbnail 需做背景+上层合成
        const upperLayerPreview = canvasInstance.toDataURL({
            format: 'png',
            multiplier: 2
        })
        preview = await generateSlidePreview(
            upperLayerPreview,
            currentOverview.overviewId,
            canvasInstance.width || 400,
            canvasInstance.height || 400,
            2,
        )

        const slideId = generateSlideId()

        const newSlide = {
            slideId,
            json,
            preview,
            dataTypeArray,
            markerIdArray,
            forceTypeArray,
            dataArray,
            isErasePathArray,
            origOpacityArray: [],
            // 初始化个性化设置默认值
            iterations: 180,
            rotation: true,
            hole: false,
            orientation: 'free' as 'free' | 'center',
            margin: 0,
            emitter_type: '',
            isResult: isResult
        }

        // 如果不是结果 slide，需要检查是否有结果 slide，如果有则插入到结果之前
        if (!isResult) {
            // 查找结果 slide 的索引（结果必定在最后）
            const lastIndex = currentOverview.collageSeries.length - 1
            const lastSlide = currentOverview.collageSeries[lastIndex]
            if (lastSlide && lastSlide.isResult === true) {
                // 如果最后一个 slide 是结果，在它之前插入
                currentOverview.collageSeries.splice(lastIndex, 0, newSlide)
                currentSlideIndex.value = lastIndex
            } else {
                // 没有结果 slide，直接 push
                currentOverview.collageSeries.push(newSlide)
                currentSlideIndex.value = currentOverview.collageSeries.length - 1
            }
        } else {
            // 是结果 slide，直接 push 到最后
            currentOverview.collageSeries.push(newSlide)
            currentSlideIndex.value = currentOverview.collageSeries.length - 1
        }

        stopListen.value = false
    }

    // 选择幻灯片（可 await：确保 load/恢复属性完成）
    async function handleCollageSeriesSelect(idx: number): Promise<void> {
        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance || overviews.value.length === 0) return

        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview || !currentOverview.collageSeries[idx]) return

        stopListen.value = true
        currentSlideIndex.value = idx
        const json = currentOverview.collageSeries[idx].json
        const jsonObj = typeof json === 'string' ? JSON.parse(json) : json
        const dataTypeArray = currentOverview.collageSeries[idx].dataTypeArray
        const markerIdArray = currentOverview.collageSeries[idx].markerIdArray || []
        const forceTypeArray = currentOverview.collageSeries[idx].forceTypeArray || []
        const dataArray = currentOverview.collageSeries[idx].dataArray || []
        const origOpacityArray = currentOverview.collageSeries[idx].origOpacityArray || []
        const isErasePathArray = currentOverview.collageSeries[idx].isErasePathArray || []
        // 清空当前画布
        clearCanvas()
        if (jsonObj.objects.length > 0) {
            await new Promise<void>((resolve) => {
                canvasInstance.loadFromJSON(json, () => {
                    setTimeout(() => {
                        // 顶层 Fabric 保持透明，底层静态背景层负责显示背景
                        canvasInstance.backgroundColor = 'rgba(0,0,0,0)'
                        canvasInstance.renderAll()
                        // 恢复自定义属性
                        restoreCustomProperties(
                            canvasInstance,
                            dataTypeArray,
                            markerIdArray,
                            forceTypeArray,
                            dataArray,
                            origOpacityArray,
                            isErasePathArray
                        )
                        // updateCurrentSlide()
                        stopListen.value = false
                        resolve()
                    }, 50)
                })
            })
        } else {
            // 顶层 Fabric 保持透明
            canvasInstance.backgroundColor = 'rgba(0,0,0,0)'
            canvasInstance.renderAll()
            stopListen.value = false
        }

    }

    // 复制幻灯片
    function handleDuplicateSlide(idx: number) {
        if (overviews.value.length === 0) return

        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview || idx < 0 || idx >= currentOverview.collageSeries.length) return

        const canvasInstance = canvasRef.value?.()
        if (!canvasInstance) return

        stopListen.value = true

        // 获取要复制的幻灯片
        const originalSlide = currentOverview.collageSeries[idx]

        // 创建新的 slideId
        const newSlideId = generateSlideId()

        // 复制幻灯片数据
        const duplicatedSlide = {
            slideId: newSlideId,
            json: originalSlide.json,
            preview: originalSlide.preview,
            dataTypeArray: [...originalSlide.dataTypeArray],
            markerIdArray: [...originalSlide.markerIdArray],
            forceTypeArray: [...originalSlide.forceTypeArray],
            dataArray: [...(originalSlide.dataArray || [])],
            isErasePathArray: [...(originalSlide.isErasePathArray || [])],
            origOpacityArray: [...(originalSlide.origOpacityArray || [])],
            // 复制个性化设置
            iterations: originalSlide.iterations ?? 180,
            rotation: originalSlide.rotation ?? true,
            hole: originalSlide.hole ?? false,
            orientation: originalSlide.orientation ?? 'free'
        }

        // 在复制目标后面插入新幻灯片
        currentOverview.collageSeries.splice(idx + 1, 0, duplicatedSlide)

        // 如果复制的幻灯片在当前幻灯片之前或等于当前幻灯片，需要调整当前索引
        if (idx <= currentSlideIndex.value) {
            currentSlideIndex.value += 1
        }

        stopListen.value = false

    }

    // 删除幻灯片
    function handleDeleteCollageSeries(idx: number) {
        if (overviews.value.length === 0) return

        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview || currentOverview.collageSeries.length <= 1) return // 至少保留一个幻灯片

        // 如果删除的是当前幻灯片
        if (idx === currentSlideIndex.value) {
            if (currentSlideIndex.value > 0) {
                currentSlideIndex.value = Math.max(0, idx - 1)
                handleCollageSeriesSelect(Math.max(0, idx - 1))
            }
            else {
                handleCollageSeriesSelect(idx + 1)
                currentSlideIndex.value = 0
            }

        } else if (idx < currentSlideIndex.value) {
            currentSlideIndex.value -= 1
        }
        currentOverview.collageSeries.splice(idx, 1)
        generateOverviewPreview()
    }




    // 恢复自定义属性
    function restoreCustomProperties(
        canvasInstance: Canvas,
        dataTypeArray: any[],
        markerIdArray: any[] = [],
        forceTypeArray: any[] = [],
        dataArray: any[] = [],
        origOpacityArray: number[] = [],
        isErasePathArray: boolean[] = []
    ) {
        const objects = canvasInstance.getObjects()
        // 遍历画布对象和JSON对象，恢复自定义属性
        objects.forEach((obj, index) => {
            obj.set('selectable', false)
            obj.set('evented', false)
            if (dataTypeArray[index]) {
                obj.set('dataType', dataTypeArray[index])
                if (dataTypeArray[index] === 'emitter') {
                    obj.hasControls = false
                }
                if (dataTypeArray[index] === 'marker') {
                    obj.hasControls = false
                    obj.selectable = true
                    obj.evented = true
                }
            }
            obj.set('isErasePath', isErasePathArray[index] ?? false)
            if (markerIdArray[index]) {
                obj.set('markerId', markerIdArray[index])
            }
            if (forceTypeArray[index]) {
                obj.set('forceType', forceTypeArray[index])
                // 恢复力对象的锁定属性
                if (forceTypeArray[index] === 'fieldForce') {
                    obj.setControlVisible('tl', false);
                    obj.setControlVisible('tr', false);
                    obj.setControlVisible('br', false);
                    obj.setControlVisible('bl', false);
                    obj.setControlVisible('ml', false);
                    obj.setControlVisible('mt', false);
                    obj.setControlVisible('mr', false);
                    obj.setControlVisible('mb', false);
                }
                else if (forceTypeArray[index] === 'pointForce') {
                    obj.hasControls = false
                }
            }
            if (dataArray[index] !== undefined && dataArray[index] !== null) {
                obj.set('data', dataArray[index])
            }
            if (origOpacityArray[index] !== undefined && origOpacityArray[index] !== null) {
                const baseOpacity = origOpacityArray[index]
                const extendedObj = obj as { _origOpacity?: number }
                extendedObj._origOpacity = baseOpacity
                obj.set('opacity', baseOpacity)
            }
        })
    }



    // 背景变更后的统一处理：刷新当前 overview 下全部 slide 及 overview preview
    async function handleBackgroundChange() {
        if (overviews.value.length === 0) return
        const currentOverview = overviews.value[currentOverviewIndex.value]
        if (!currentOverview || currentOverview.collageSeries.length === 0) return

        for (let index = 0; index < currentOverview.collageSeries.length; index++) {
            try {
                const slide = currentOverview.collageSeries[index]
                const slideData = typeof slide.json === 'string' ? JSON.parse(slide.json) : slide.json
                const canvas = canvasRef.value?.()
                if (!canvas) continue

                const originalWidth = canvas.width
                const originalHeight = canvas.height
                const tempCanvas = new Canvas(document.createElement('canvas'), {
                    width: originalWidth,
                    height: originalHeight
                })

                try {
                    await tempCanvas.loadFromJSON(slideData)
                    tempCanvas.renderAll()

                    const upperLayerPreview = tempCanvas.toDataURL({
                        format: 'png',
                        multiplier: 2
                    })
                    const newPreview = await generateSlidePreview(
                        upperLayerPreview,
                        currentOverview.overviewId,
                        originalWidth || 400,
                        originalHeight || 400,
                        2,
                    )

                    currentOverview.collageSeries[index].preview = newPreview
                } finally {
                    tempCanvas.dispose()
                }
            } catch (error) {
                console.error(`批量重建 slide ${index} preview 时出错:`, error)
            }
        }

        // 同步刷新当前 overview 的合成预览
        await generateOverviewPreview()
    }


    // 添加新总览
    function addNewOverview() {
        const overviewId = generateOverviewId()
        const slideId = generateSlideId()
        stopListen.value = true
        clearCanvas()
        const { width, height } = getCurrentCanvasSize()
        // 创建空白幻灯片
        const canvasInstance = canvasRef.value?.()
        let json = ''
        let preview = ''

        if (canvasInstance) {
            json = JSON.stringify(canvasInstance.toJSON())
            preview = canvasInstance.toDataURL({
                format: 'png',
                multiplier: 2
            })
        }

        const newOverview: Overview = {
            overviewId,
                    preview: preview, // 初始预览就是第一个幻灯片的预览
                    width,
                    height,
                collageSeries: [{
                    slideId,
                    json,
                    preview,
                    dataTypeArray: [],
                    markerIdArray: [],
                    forceTypeArray: [],
                    dataArray: [],
                    origOpacityArray: []
                }]
        }

        overviews.value.push(newOverview)
        currentOverviewIndex.value = overviews.value.length - 1
        currentSlideIndex.value = 0
        stopListen.value = false
    }

    // 选择总览
    function selectOverview(overviewIdx: number) {
        if (overviewIdx >= 0 && overviewIdx < overviews.value.length) {
            currentOverviewIndex.value = overviewIdx
            currentSlideIndex.value = 0
        }
    }

    // 删除总览
    function handleDeleteOverview(overviewIdx: number) {
        if (overviews.value.length <= 1) return // 至少保留一个总览

        stopListen.value = true

        // 获取要删除的总览ID，用于清理背景数据
        const overviewToDelete = overviews.value[overviewIdx]
        const overviewIdToDelete = overviewToDelete?.overviewId

        // 计算删除后的新当前总览索引
        let newCurrentOverviewIndex = currentOverviewIndex.value

        if (overviewIdx === currentOverviewIndex.value) {
            // 删除的是当前总览
            if (overviewIdx < overviews.value.length - 1) {
                // 不是最后一个，保持当前索引不变（下一个总览会自动成为当前索引）
                newCurrentOverviewIndex = overviewIdx
            } else {
                // 是最后一个，切换到前一个总览
                newCurrentOverviewIndex = overviewIdx - 1
            }
        } else if (overviewIdx < currentOverviewIndex.value) {
            // 删除的总览在当前总览之前，当前索引需要减1
            newCurrentOverviewIndex = currentOverviewIndex.value - 1
        }
        // 先删除总览
        overviews.value.splice(overviewIdx, 1)

        // 清理被删除总览的背景数据
        if (overviewIdToDelete) {
            const backgroundStore = useBackgroundStore()
            backgroundStore.clearCurrentOverviewBackground(overviewIdToDelete)
        }

        // 切换到新的当前总览
        currentOverviewIndex.value = newCurrentOverviewIndex
        currentSlideIndex.value = 0
        handleCollageSeriesSelect(0)

        stopListen.value = false
    }

    return {
        collageSeries,
        overviews,
        currentOverviewIndex,
        currentSlideIndex,
        stopListen,
        canvasRef,
        isCollageSeriesPanelCollapsed,
        setCollageSeriesPanelCollapsed,
        setCanvas,
        initializeEmptySlide,
        updateCurrentSlide,
        addNewSlide,
        handleCollageSeriesSelect,
        handleDuplicateSlide,
        handleDeleteCollageSeries,
        restoreCustomProperties,
        handleBackgroundChange,
        addNewOverview,
        selectOverview,
        handleDeleteOverview,
        generateOverviewPreview,
        loadOverviewSnapshot,
    }
})
