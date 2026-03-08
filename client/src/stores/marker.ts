import { defineStore } from 'pinia'
import { ref } from 'vue'

/** public/marks 下预置的 SVG 文件名（预加载用，与目录内文件名一致） */
const PRELOAD_MARK_FILES = [
  'coin.svg', 'bubble.svg', 'ball.svg', 'bee.svg', 'Cactus.svg', 'cat.svg', 'crown.svg', 'earth.svg',
  'flower.svg', 'flower2.svg', 'flowers.svg',
  'heart.svg', 'icecream.svg', 'leaf.svg', 'lollipop.svg', 'note.svg',
  'plant.svg', 'rabbit.svg', 'rookie.svg', 'smile.svg', 'star.svg', 'sugar.svg', 'sun.svg',
]

export interface MarkerData {
  id: string
  name: string
  thumbnail: string
  // svg 或图片的原始内容（data URL）
  source: string
}

export const useMarkerStore = defineStore('marker', () => {
  // 存储所有 marker 数据
  const markers = ref<MarkerData[]>([])
  let preloaded = false

  /** 预加载 public/marks 下的 SVG，仅执行一次 */
  async function loadPreloadedMarks() {
    if (preloaded) return
    preloaded = true
    const base = import.meta.env.BASE_URL.replace(/\/$/, '') + '/marks/'
    for (const file of PRELOAD_MARK_FILES) {
      try {
        const url = base + file
        const res = await fetch(url)
        if (!res.ok) continue
        const svgString = await res.text()
        const name = file.replace(/\.svg$/i, '')
        addMarker({
          name,
          thumbnail: url,
          source: svgString,
        })
      } catch {
        // 忽略单个文件失败
      }
    }
  }

  // 添加新的 marker
  const addMarker = (marker: Omit<MarkerData, 'id'>) => {
    const newMarker: MarkerData = {
      ...marker,
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
  
  return {
    markers,
    loadPreloadedMarks,
    addMarker,
    deleteMarker,
    clearAllMarkers,
  }
})
