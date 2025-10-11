import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MarkerData {
  id: string
  thumbnail: string
  jsonData: any
  mapping: {
    dataRange: { start: number; end: number }
  }
}

export const useMarkerStore = defineStore('marker', () => {
  // 存储所有 marker 数据
  const markers = ref<MarkerData[]>([])
  
  // 添加新的 marker
  const addMarker = (marker: Omit<MarkerData, 'id' | 'mapping'>) => {
    const newMarker: MarkerData = {
      ...marker,
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mapping: {
        dataRange: { start: -1, end: -1 }
      }
    }
    markers.value.push(newMarker)
    return newMarker
  }
  
  // 删除 marker
  const deleteMarker = (id: string) => {
    const markerIndex = markers.value.findIndex(marker => marker.id === id)
    if (markerIndex !== -1) {
      markers.value.splice(markerIndex, 1)
      return true
    }
    return false
  }
  
  // 清空所有 markers
  const clearAllMarkers = () => {
    markers.value = []
  }
  
  // 重置所有 marker 的 mapping 配置为默认值
  const resetAllMarkerMappings = () => {
    markers.value.forEach(marker => {
      marker.mapping = {
        dataRange: { start: -1, end: -1 }
      }
    })
  }
  
  // 获取 marker 的映射配置
  const getMarkerMapping = (markerId: string) => {
    const marker = markers.value.find(m => m.id === markerId)
    return marker?.mapping || {
      dataRange: { start: -1, end: -1 }
    }
  }
  
  // 更新 marker 的数据范围
  const updateDataRange = (markerId: string, start: number, end: number) => {
    const markerIndex = markers.value.findIndex(m => m.id === markerId)
    if (markerIndex !== -1) {
      markers.value[markerIndex].mapping.dataRange = { start, end }
    }
  }
  
  return {
    markers,
    addMarker, 
    deleteMarker,
    clearAllMarkers,
    getMarkerMapping,
    updateDataRange,
    resetAllMarkerMappings
  }
})
