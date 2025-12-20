import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Canvas } from 'fabric'
import { useCollageSeriesStore } from '~/stores/collageSeries'
import { useTableStore, type ColumnFilterCard } from '~/stores/table'

export const useDataScaleStore = defineStore('dataScale', () => {
 

  const canvasRef = ref<(() => Canvas | null) | null>(null)
  const collageSeriesStore = useCollageSeriesStore()

  // 设置 canvas 引用
  function setCanvas(canvas: () => Canvas | null) {
    canvasRef.value = canvas
  }
  
  // 计算归一化参数和归一化函数
  // 根据每个 filter 的 visualAttribute 提取对应的数据值
  function getNormalizationParams(card: ColumnFilterCard | null) {
    // 定义归一化范围
    const minDisplaySize = 20  // 最小显示尺寸
    const maxDisplaySize = 70  // 最大显示尺寸
    const defaultSize = 45  // 默认尺寸

    // 提取所有选中 filter 的数据和对应的列值
    const data: any[] = []
    const columnValues: number[] = []
    
    if (card) {
      for (const filter of card.filters) {
        if (filter.isSelected && filter.data && filter.data.length > 0) {
          const visualAttribute = filter.visualAttribute
          
          for (const row of filter.data) {
            data.push(row)
            
            // 提取 visualAttribute 对应的值
            if (visualAttribute && row[visualAttribute] !== undefined) {
              const value = parseFloat(row[visualAttribute])
              const numValue = !isNaN(value) && value > 0 ? value : 1
              columnValues.push(numValue)
            } else {
              columnValues.push(1)
            }
          }
        }
      }
    }

    // 计算归一化参数
    const minValue = columnValues.length > 0 ? Math.min(...columnValues) : 1
    const maxValue = columnValues.length > 0 ? Math.max(...columnValues) : 1

    // 归一化函数：将原始值映射到 [minDisplaySize, maxDisplaySize] 范围
    const normalize = (value: number, min: number, max: number): number => {
      if (max === min) return (minDisplaySize + maxDisplaySize) / 2
      return minDisplaySize + ((value - min) / (max - min)) * (maxDisplaySize - minDisplaySize)
    }

    // 归一化后的值列表
    const normalized = columnValues.map((value: number) => {
      return normalize(value, minValue, maxValue)
    })

    return {
      data,
      normalized,
      defaultSize
    }
  }


  // 更新特定 filter 的 marker 尺寸
  function updateFilterMarkersScale(filterId: string) {
    const canvas = canvasRef.value?.()
    if (!canvas) return

    const tableStore = useTableStore()
    
    // 找到对应的 filter 和 card
    let targetFilter: any = null
    let targetCard: ColumnFilterCard | null = null
    
    for (const card of tableStore.columnFilterCards) {
      const filter = card.filters.find(f => f.id === filterId)
      if (filter) {
        targetFilter = filter
        targetCard = card
        break
      }
    }
    
    if (!targetFilter || !targetCard || !targetFilter.encoding || !targetFilter.data || targetFilter.data.length === 0) {
      return
    }

    const encoding = targetFilter.encoding
    const channel = encoding.channel
    const scale = encoding.scale || 1
    
    if (!channel) {
      // 如果没有 channel，使用默认尺寸
      const defaultSize = 45
      const objects = canvas.getObjects()
      objects.forEach((obj: any) => {
        if (obj.get('dataType') === 'marker' && obj.get('clusterId') === filterId) {
          const currentWidth = obj.width || obj.getScaledWidth()
          const currentHeight = obj.height || obj.getScaledHeight()
          const currentSize = Math.max(currentWidth, currentHeight)
          const newScale = defaultSize / currentSize
          obj.set({
            scaleX: newScale,
            scaleY: newScale
          })
        }
      })
      canvas.renderAll()
      collageSeriesStore.updateCurrentSlide()
      return
    }

    // 计算该 filter 的 normalized 值
    const minDisplaySize = 20
    const maxDisplaySize = 70
    const defaultSize = 45
    
    const visualAttribute = targetFilter.visualAttribute
    const columnValues: number[] = []
    
    for (const row of targetFilter.data) {
      if (visualAttribute && row[visualAttribute] !== undefined) {
        const value = parseFloat(row[visualAttribute])
        const numValue = !isNaN(value) && value > 0 ? value : 1
        columnValues.push(numValue)
      } else {
        columnValues.push(1)
      }
    }
    
    const minValue = columnValues.length > 0 ? Math.min(...columnValues) : 1
    const maxValue = columnValues.length > 0 ? Math.max(...columnValues) : 1
    
    const normalize = (value: number, min: number, max: number): number => {
      if (max === min) return (minDisplaySize + maxDisplaySize) / 2
      return minDisplaySize + ((value - min) / (max - min)) * (maxDisplaySize - minDisplaySize)
    }
    
    const normalized = columnValues.map((value: number) => {
      return normalize(value, minValue, maxValue)
    })

    // 更新画布上所有对应 filterId 的 marker
    const objects = canvas.getObjects()
    let dataIndex = 0
    
    objects.forEach((obj: any) => {
      if (obj.get('dataType') === 'marker' && obj.get('clusterId') === filterId) {
        const markerData = obj.get('data')
        // 找到 marker 在 filter.data 中的索引
        const indexInFilterData = targetFilter.data.findIndex((row: any) => {
          // 通过比较数据行来找到对应的索引
          return JSON.stringify(row) === JSON.stringify(markerData)
        })
        
        if (indexInFilterData >= 0 && indexInFilterData < normalized.length) {
          const normalizedValue = normalized[indexInFilterData]
          // 获取对象的原始尺寸（未缩放前的尺寸）
          const currentScaleX = obj.get('scaleX') || 1
          const currentScaleY = obj.get('scaleY') || 1
          const scaledWidth = obj.getScaledWidth()
          const scaledHeight = obj.getScaledHeight()
          const originalWidth = scaledWidth / currentScaleX
          const originalHeight = scaledHeight / currentScaleY
          const currentSize = Math.max(originalWidth, originalHeight)
          
          let scaleX = defaultSize / currentSize
          let scaleY = defaultSize / currentSize
          
          if (channel === 'width') {
            scaleX = normalizedValue / currentSize
            scaleX *= scale
          } else if (channel === 'height') {
            scaleY = normalizedValue / currentSize
            scaleY *= scale
          } else if (channel === 'size') {
            scaleX = normalizedValue / currentSize
            scaleY = normalizedValue / currentSize
            scaleX *= scale
            scaleY *= scale
          }
          
          obj.set({
            scaleX: scaleX,
            scaleY: scaleY
          })
          obj.setCoords()
        }
        dataIndex++
      }
    })

    canvas.renderAll()
    collageSeriesStore.updateCurrentSlide()
  }

  return { 
    setCanvas, 
    getNormalizationParams,
    updateFilterMarkersScale
  }
})

