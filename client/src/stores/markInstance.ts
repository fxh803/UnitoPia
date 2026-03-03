import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MarkChildInstance {
  id: string
  name: string
  // 当前子实例选中的分组值（仅 group 父实例下有效）
  selectedValue: string | null
  // 这个子实例对应的实体数量
  entities: number
  // 这个子实例包含的实体在 tableData 中的行索引
  entityIndices: number[]
  // 这个子实例对应实体在字段上的取值列表
  entitiesDetail: unknown[]
}

export interface MarkInstance {
  id: string
  name: string
  // 父实例整体覆盖的实体数量（对于 group，为所有子实例实体之和）
  entities: number
  fieldType: 'numeric' | 'categorical' | null
  fieldName: string | null
  // 是否为 group 父实例（有子实例）
  isGroup: boolean
  // 非 group 时：父实例整体覆盖的实体行索引；group 时：置为 null
  entityIndices: number[] | null
  // 非 group 时：当前字段在这些实体上的取值列表；group 时：置为 null
  entitiesDetail: unknown[] | null
  // group 类型下的子实例列表；普通 mark 为空数组
  children: MarkChildInstance[]
}

export const useMarkInstanceStore = defineStore('markInstance', () => {
  const markInstances = ref<MarkInstance[]>([])

  function addMarkInstance(mark: Omit<MarkInstance, 'id'>) {
    const id = `mark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    markInstances.value.push({
      id,
      ...mark,
    })
  }

  function removeMarkInstance(id: string) {
    markInstances.value = markInstances.value.filter(item => item.id !== id)
  }

  function clearAllMarkInstances() {
    markInstances.value = []
  }

  function updateMarkInstance(id: string, payload: Partial<Omit<MarkInstance, 'id'>>) {
    const target = markInstances.value.find(item => item.id === id)
    if (!target) return
    Object.assign(target, payload)
  }

  return {
    markInstances,
    addMarkInstance,
    removeMarkInstance,
    clearAllMarkInstances,
    updateMarkInstance,
  }
})

