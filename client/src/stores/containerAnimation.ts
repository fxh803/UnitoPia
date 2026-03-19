import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import paper from 'paper'
import { useAnimationStore } from '~/stores/animation'

// 定义 container 播放 / 高亮 相关的数据结构（仅针对当前 overview）
interface ContainerRecord {
  container: string // base64 字符串
}

export const useContainerAnimationStore = defineStore('containerAnimation', () => {
  // 存储所有 container 记录
  const containerRecords = ref<ContainerRecord[]>([])
  const shining_paths = ref<any[]>([])

  // 添加 container 记录
  function addContainerRecord(
    container: string,
  ) {
    const record: ContainerRecord = {
      container,
    }
    containerRecords.value.push(record)
  }

  function containerAnimation(event: any) {
    const animationStore = useAnimationStore()
    const { collaging, now_collage_idx } = storeToRefs(animationStore)
    const changeRate = 0.3
    const maxOpacity = 0.8
    const minOpacity = 0.1
    // 检查 collaging 状态，如果为 false 则停止动画
    if (!collaging.value)
      return

    for (let idx = 0; idx < shining_paths.value.length; idx++) {
      const path = shining_paths.value[idx]
      if (idx === now_collage_idx.value) {
        path.opacity += path.changeRate * event.delta
        if (path.opacity >= minOpacity && !path.initialized) {
          path.initialized = true
        }
        if (path.initialized) {
          if (path.opacity > maxOpacity) {
            path.opacity = maxOpacity
            path.changeRate = -changeRate
          }
          else if (path.opacity < minOpacity) {
            path.opacity = minOpacity
            path.changeRate = changeRate
          }
        }
      }
      else {
        if (path.opacity <= 0) {
          path.opacity = 0
          continue
        }
        path.opacity += path.changeRate * event.delta
        path.changeRate = -changeRate
      }
    }
  }

  function createShiningPaths() {
    for (let i = 0; i < containerRecords.value.length; i++) {
      const item = containerRecords.value[i]
      const raster = new paper.Raster({
        source: item.container,
        position: paper.view.center,
        // 不再区分 overview，使用数组索引与 now_collage_idx 对齐
        opacity: 0,
        dataType: 'container',
        initialized: false,
        changeRate: 0.2,
        onError: (e: any) => {
          console.log('onError', e)
        },
      })
      shining_paths.value.push(raster)
    }
  }

  // 清空所有记录
  function clearAllRecords() {
    containerRecords.value = []
  }

  // 清理 shining paths
  function clearShiningPaths() {
    shining_paths.value.forEach((path) => {
      path.remove();
    })
    shining_paths.value = []
  }

  return {
    containerRecords,
    addContainerRecord,
    clearAllRecords,
    containerAnimation,
    createShiningPaths,
    clearShiningPaths,
  }
})

