import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ContainerLibraryItem {
  id: string
  name: string
  thumbnail: string
  // svg 或图片的原始内容（data URL）
  source: string
}

export const useContainerStore = defineStore('container', () => {
  const containers = ref<ContainerLibraryItem[]>([])

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
    addContainer,
    deleteContainer,
    clearAllContainers,
  }
})

