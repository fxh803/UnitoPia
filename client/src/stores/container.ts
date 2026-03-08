import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sendUploadContainerToServer } from '~/composables/server'

/** public/containers 下预置的 PNG 文件名（预加载用） */
const PRELOAD_CONTAINER_FILES = [
  'bear.png', 'bird.png', 'circle.png', 'bottle.png', 'princess.png', 'vis.png',
]

export interface ContainerLibraryItem {
  id: string
  name: string
  thumbnail: string
  // svg 或图片的原始内容（data URL）
  source: string
}

export const useContainerStore = defineStore('container', () => {
  const containers = ref<ContainerLibraryItem[]>([])
  let preloaded = false

  /** 预加载 public/containers 下的 PNG，经后端处理后加入库；仅执行一次，仅成功的才加入列表 */
  async function loadPreloadedContainers() {
    if (preloaded) return
    preloaded = true
    const base = import.meta.env.BASE_URL.replace(/\/$/, '') + '/containers/'
    for (const file of PRELOAD_CONTAINER_FILES) {
      try {
        const url = base + file
        const res = await fetch(url)
        if (!res.ok) continue
        const blob = await res.blob()
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        // 与 LibrariesSection 一致：先经后端处理再入库
        const processed = await sendUploadContainerToServer(base64)
        const finalBase64 = processed || base64
        if (!finalBase64) continue
        const name = file.replace(/\.png$/i, '')
        addContainer({
          name,
          thumbnail: finalBase64,
          source: finalBase64,
        })
      } catch {
        // 忽略单个文件失败
      }
    }
  }

  const addContainer = (item: Omit<ContainerLibraryItem, 'id'>) => {
    const newItem: ContainerLibraryItem = {
      ...item,
      id: `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    containers.value.push(newItem)
    return newItem
  }

  const deleteContainer = (id: string) => {
    const idx = containers.value.findIndex(item => item.id === id)
    if (idx !== -1) {
      containers.value.splice(idx, 1)
      return true
    }
    return false
  }

  const clearAllContainers = () => {
    containers.value = []
  }

  return {
    containers,
    loadPreloadedContainers,
    addContainer,
    deleteContainer,
    clearAllContainers,
  }
})

