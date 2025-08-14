import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTableStore } from '~/stores/table'
import { Canvas } from 'fabric'
import { storeToRefs } from 'pinia'
import { useCollageSeriesStore } from '~/stores/collageSeries'
export const useOverviewStore = defineStore('overview', () => {
  const tableStore = useTableStore()
  const collageSeriesStore = useCollageSeriesStore()
  const { stopListen } = storeToRefs(collageSeriesStore)
  const canvasRef = ref<(() => Canvas | null) | null>(null)

  // 设置 canvas 引用
  function setCanvas(canvas: () => Canvas | null) {
    canvasRef.value = canvas
  }

  // Marker 对象的数据结构
  interface MarkerObject {
    id: string
    object: any // Fabric.js 对象
    thumbnail: string // 缩略图
    visualEncoding: 'size' | 'width' | 'height'
    dataField: string
    dataRange: {
      start: number
      end: number
    }
  }

  // 响应式数据
  const markerObjects = ref<MarkerObject[]>([])

  // 保存数据绑定设置的映射 - 按 slide 和 marker ID 保存
  const dataBindingSettings = ref<Map<string, { dataField: string, dataRange: { start: number, end: number }, visualEncoding: 'size' | 'width' | 'height' }>>(new Map())

  // 获取所有 marker 对象
  const getMarkerObjects = async () => {
    const canvas = canvasRef.value?.()
    if (!canvas) {
      return []
    }

    const objects = canvas.getObjects()

    const markerObjects = objects.filter(obj => {
      const dataType = obj.get('dataType')
      return dataType === 'marker'
    })


    // 并行处理所有缩略图生成
    const markerDataPromises = markerObjects.map(async (obj) => {
      // 生成缩略图 
      const thumbnail = await generateThumbnail(obj)

      // 获取对象的 markerId
      const markerId = obj.get('markerId')
      // 获取当前 slide ID
      const currentSlideId = collageSeriesStore.getCurrentSlideId()
      const settingsKey = `${currentSlideId}-${markerId}`

      // 获取保存的设置，如果没有则使用默认值
      const savedSettings = dataBindingSettings.value.get(settingsKey) || {
        dataField: '',
        dataRange: { start: -1, end: -1 },
        visualEncoding: 'size' as const
      }


      return {
        id: markerId,
        object: obj,
        thumbnail,
        visualEncoding: savedSettings.visualEncoding,
        dataField: savedSettings.dataField,
        dataRange: savedSettings.dataRange
      }
    })

    return Promise.all(markerDataPromises)
  }

  // 生成缩略图
  async function generateThumbnail(obj: any) {
    const canvas = canvasRef.value?.()
    if (!canvas) return ''

    try {
      // 创建一个临时的 Fabric.js canvas 来渲染对象
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 60
      tempCanvas.height = 60

      const tempFabricCanvas = new Canvas(tempCanvas, {
        width: 60,
        height: 60,
        backgroundColor: '#f5f5f5'
      })

      // 克隆对象以避免修改原对象
      // 克隆对象
      const clonedObj = await obj.clone();
      if (!clonedObj || typeof clonedObj.set !== 'function') {
        console.error('克隆失败或克隆对象无效:', clonedObj)
        return ''
      }
      const originWidth = clonedObj.width
      const originHeight = clonedObj.height
      // 计算缩放比例，确保对象适合缩略图 
      const scaleX = 50 / Math.max(originWidth, 1)
      const scaleY = 50 / Math.max(originHeight, 1)
      const scale = Math.min(scaleX, scaleY, 1) // 不超过原始大小

      clonedObj.set('left', 30)
      clonedObj.set('top', 30)
      clonedObj.set('scaleX', scale)
      clonedObj.set('scaleY', scale)
      clonedObj.set('originX', 'center')
      clonedObj.set('originY', 'center')
      clonedObj.set('opacity', 1) // 确保透明度还原为1
      // 添加到临时画布
      tempFabricCanvas.add(clonedObj)
      tempFabricCanvas.renderAll()

      // 获取缩略图
      const thumbnail = tempFabricCanvas.toDataURL({
        format: 'png',
        multiplier: 1
      })

      // 清理临时画布
      tempFabricCanvas.dispose()

      return thumbnail
    } catch (error) {
      console.error('生成缩略图失败:', error)
      return ''
    }
  }

  // 更新 marker 对象列表
  const updateMarkerObjects = async () => {
    if (stopListen.value) {
      return
    }
    markerObjects.value = await getMarkerObjects()
  }

  // 处理视觉编码变化
  const handleVisualEncodingChange = (markerId: string, encoding: 'size' | 'width' | 'height') => {
    const marker = markerObjects.value.find(m => m.id === markerId)
    if (marker) {
      marker.visualEncoding = encoding

      // 保存到持久化存储
      const currentSlideId = collageSeriesStore.getCurrentSlideId()
      const settingsKey = `${currentSlideId}-${markerId}`
      const existingSettings = dataBindingSettings.value.get(settingsKey) || {
        dataField: marker.dataField,
        dataRange: marker.dataRange,
        visualEncoding: encoding
      }
      dataBindingSettings.value.set(settingsKey, {
        ...existingSettings,
        visualEncoding: encoding
      })
      console.log(`保存设置 - Slide ${currentSlideId}, Marker ${markerId}:`, { visualEncoding: encoding })
    }
  }

  // 处理数据字段变化
  const handleDataFieldChange = (markerId: string, field: string) => {
    const marker = markerObjects.value.find(m => m.id === markerId)
    if (marker) {
      marker.dataField = field

      // 保存到持久化存储
      const currentSlideId = collageSeriesStore.getCurrentSlideId()
      const settingsKey = `${currentSlideId}-${markerId}`
      const existingSettings = dataBindingSettings.value.get(settingsKey) || {
        dataField: field,
        dataRange: marker.dataRange,
        visualEncoding: marker.visualEncoding
      }
      dataBindingSettings.value.set(settingsKey, {
        ...existingSettings,
        dataField: field
      })
      console.log(`保存设置 - Slide ${currentSlideId}, Marker ${markerId}:`, { dataField: field })
    }
  }

  // 处理数据范围变化
  const handleDataRangeChange = (markerId: string, start: number, end: number) => {
    const marker = markerObjects.value.find(m => m.id === markerId)
    if (marker) {
      marker.dataRange = { start, end }

      // 保存到持久化存储
      const currentSlideId = collageSeriesStore.getCurrentSlideId()
      const settingsKey = `${currentSlideId}-${markerId}`
      const existingSettings = dataBindingSettings.value.get(settingsKey) || {
        dataField: marker.dataField,
        dataRange: { start, end },
        visualEncoding: marker.visualEncoding
      }
      dataBindingSettings.value.set(settingsKey, {
        ...existingSettings,
        dataRange: { start, end }
      })
      console.log(`保存设置 - Slide ${currentSlideId}, Marker ${markerId}:`, { dataRange: { start, end } })
    }
  }

  // 复制数据绑定设置
  const copyDataBindingSettings = (originalSlideId: string, newSlideId: string) => {
    console.log('开始复制数据绑定设置:', { originalSlideId, newSlideId })

    // 遍历所有数据绑定设置，找到属于原幻灯片的设置
    dataBindingSettings.value.forEach((settings, key) => {
      console.log('检查键:', key)

      if (key.startsWith(`${originalSlideId}-`)) {
        // 提取完整的 markerId（可能包含多个连字符）
        const markerIdPart = key.substring(originalSlideId.length + 1) // +1 是为了去掉连字符
        const newKey = `${newSlideId}-${markerIdPart}`
        console.log(newKey)
        // 复制设置
        dataBindingSettings.value.set(newKey, { ...settings })
        console.log(`复制数据绑定设置: ${key} -> ${newKey}`)
      }
    })
  }




  // 计算属性
  const markerCount = computed(() => markerObjects.value.length)
  const hasMarkers = computed(() => markerCount.value > 0)

  return {
    // 状态
    markerObjects,
    dataBindingSettings,
    // 计算属性
    markerCount,
    hasMarkers,

    // 方法
    updateMarkerObjects,
    handleVisualEncodingChange,
    handleDataFieldChange,
    handleDataRangeChange,
    copyDataBindingSettings,
    setCanvas
  }
}) 