<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import paper from 'paper'
import { useBackgroundStore } from '~/stores/background'
import { useCollageSeriesStore } from '~/stores/collageSeries'
import { usePaperExportStore } from '~/stores/paperExport'

const paperExportStore = usePaperExportStore()

const paperCanvasRef = ref<HTMLCanvasElement | null>(null)
const backgroundStore = useBackgroundStore()
const collageSeriesStore = useCollageSeriesStore()
// 与主画布对齐的宽高（不再强制 1:1）
const canvasWidth = ref(0)
const canvasHeight = ref(0)
function updateBackground() {
  // 先删除现有背景
  const objects = paper.project.activeLayer.children
  objects.forEach((obj: any) => {
    if (obj && obj.dataType === 'background') {
      obj.remove()
    }
  })

  // 这里只更新激活的 overview 的 background，不会根据动画改变背景
  const currentOverview = collageSeriesStore.overviews[collageSeriesStore.currentOverviewIndex]
  const overviewId = currentOverview?.overviewId

  // 如果 background 存在，绘制到画布上
  const bg = backgroundStore.getCurrentOverviewBackground(overviewId)
  if (bg) {
    const backgroundImage = new paper.Raster({ source: bg, dataType: 'background' })
    // 直接使用 backgroundStore 中记录的 transform（强制对齐，不再从 Fabric 现场探测/退回）
    const tf = overviewId ? backgroundStore.getCurrentOverviewBackgroundTransform(overviewId) : null

    backgroundImage.onLoad = () => {
      if (tf) {
        backgroundImage.scaling = new paper.Point(tf.scaleX, tf.scaleY)

        // Paper Raster.position 是中心点；Fabric 的 left/top 是基于 origin 的锚点
        const scaledW = backgroundImage.width * tf.scaleX
        const scaledH = backgroundImage.height * tf.scaleY
        const centerX =
          tf.originX === 'center' ? tf.left :
          tf.originX === 'right' ? tf.left - scaledW / 2 :
          tf.left + scaledW / 2
        const centerY =
          tf.originY === 'center' ? tf.top :
          tf.originY === 'bottom' ? tf.top - scaledH / 2 :
          tf.top + scaledH / 2

        backgroundImage.position = new paper.Point(centerX, centerY)
      }
      backgroundImage.sendToBack()
    }
  }
}

onMounted(() => {
  nextTick(() => {
    // 绑定 Paper.js 到 canvas
    paper.setup(paperCanvasRef.value as HTMLCanvasElement)

    // 使用 DOM 中 .fabric-canvas 的实际渲染尺寸
    const rect = document.querySelector('.fabric-canvas')?.getBoundingClientRect()
    const width = Math.floor(rect?.width ?? 0)
    const height = Math.floor(rect?.height ?? 0)

    canvasWidth.value = width
    canvasHeight.value = height

    if (paperCanvasRef.value && width > 0 && height > 0) {
      paperCanvasRef.value.width = width
      paperCanvasRef.value.height = height
      paper.view.viewSize = new paper.Size(width, height)
      updateBackground()
      paperExportStore.setPaperCanvasEl(paperCanvasRef.value)
    }
  })
})

onUnmounted(() => {
  paperExportStore.setPaperCanvasEl(null)
  // 销毁 paper
  if (paper.view) {
    // 清除所有图层和对象
    paper.project.clear()

    // 销毁视图
    paper.view.remove()
  }

  // 清理 paper 全局状态
  if (paper.project) {
    paper.project.remove()
  }
})
</script>

<template>
  <canvas
    ref="paperCanvasRef"
    class="absolute inset-0 paper-canvas bg-[#fffef8]"
  />
</template>