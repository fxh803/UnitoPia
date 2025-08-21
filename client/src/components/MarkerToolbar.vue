<script setup lang="ts">
import { useMarkerCanvasModeStore } from '~/stores/markerCanvasMode'
import ColorPicker from './ColorPicker.vue'
import { storeToRefs } from 'pinia' 
import * as fabric from 'fabric'
import { useMarkerShapeDrawingStore } from '~/stores/markerShapeDrawing'

const markerCanvasModeStore = useMarkerCanvasModeStore()
const {mode} = storeToRefs(markerCanvasModeStore)
const { setMode } = markerCanvasModeStore

// 形状绘制store
const markerShapeDrawingStore = useMarkerShapeDrawingStore()

// 文件上传相关
const fileInputRef = ref<HTMLInputElement>()

// Marker相关功能
const clearCanvas = () => { 
    markerCanvasModeStore.clearMarkers()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files && files.length > 0) {
    // 批量处理多个文件
    Array.from(files).forEach((file) => {
      if (file.type === 'image/png') {
        // 处理PNG文件
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          console.log('PNG文件已上传:', file.name)
          
          // 将图片添加到画布作为marker对象
          addImageToCanvas(result, file.name)
        }
        reader.readAsDataURL(file)
      } else if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        // 处理SVG文件
        const reader = new FileReader()
        reader.onload = async (e) => {
          const svgString = e.target?.result as string
          console.log('SVG文件已上传:', file.name)
          
          // 将SVG添加到画布作为marker对象
          await addSVGToCanvas(svgString, file.name)
        }
        reader.readAsText(file)
      } else {
        console.warn('跳过不支持的文件类型:', file.name)
      }
    })
  }
  
  // 清空文件输入框，允许重复选择同一文件
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const addImageToCanvas = (imageDataUrl: string, fileName: string) => {
  console.log('开始添加图片到画布:', fileName)
  
  const canvasInstance = markerCanvasModeStore.getCanvas()
  if (!canvasInstance) {
    console.error('Canvas实例未找到')
    return
  }
  
  console.log('Canvas实例获取成功:', canvasInstance)

  // 使用fabric.js的Promise方式加载图片
  fabric.FabricImage.fromURL(imageDataUrl).then((fabricImg) => {
    console.log('Fabric Image创建成功:', fabricImg)
    
    // 设置图片属性
    fabricImg.set({
      left: canvasInstance.width / 2,
      top: canvasInstance.height / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      dataType: 'marker', 
      uploadType:'marker_png'
    })
    
    // 计算合适的缩放比例
    const maxWidth = canvasInstance.width * 0.3
    const maxHeight = canvasInstance.height * 0.3
    
    const scaleX = maxWidth / fabricImg.width
    const scaleY = maxHeight / fabricImg.height
    const scale = Math.min(scaleX, scaleY, 1)
    
    fabricImg.set({
      scaleX: scale,
      scaleY: scale
    })
    //设置markerId
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const markerId = `marker-${timestamp}-${randomId}`
    fabricImg.set('markerId', markerId) 

    // 将图片添加到画布
    canvasInstance.add(fabricImg) 
    // 重新渲染画布
    canvasInstance.renderAll() 
    
  }).catch((error) => {
    console.error('图片加载失败:', error)
  })
}

const addSVGToCanvas = async (svgString: string, fileName: string) => {
  console.log('开始添加SVG到画布:', fileName)
  
  try {
    const canvasInstance = markerCanvasModeStore.getCanvas()
    if (!canvasInstance) {
      console.error('Canvas实例未找到')
      return
    }
    
    console.log('Canvas实例获取成功:', canvasInstance)

    // 使用 Fabric.js 加载 SVG
    const loadedSVG = await fabric.loadSVGFromString(svgString)
    const svgObject = fabric.util.groupSVGElements(loadedSVG.objects)
    
    // 设置SVG对象属性
    svgObject.set({
      left: canvasInstance.width / 2,
      top: canvasInstance.height / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      dataType: 'marker',
      uploadType:'marker_svg'
    })
    
    // 计算合适的缩放比例
    const maxWidth = canvasInstance.width * 0.3
    const maxHeight = canvasInstance.height * 0.3
    
    const scaleX = maxWidth / svgObject.width
    const scaleY = maxHeight / svgObject.height
    const scale = Math.min(scaleX, scaleY, 1)
    
    svgObject.set({
      scaleX: scale,
      scaleY: scale
    })

    //设置markerId
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const markerId = `marker-${timestamp}-${randomId}`
    svgObject.set('markerId', markerId) 

    // 将SVG对象添加到画布
    canvasInstance.add(svgObject) 
    
    // 重新渲染画布
    canvasInstance.renderAll()
    
    console.log('SVG已成功添加到画布作为marker对象:', fileName)
    
  } catch (error) {
    console.error('SVG加载失败:', error)
  }
}

const triggerFileUpload = () => {
  markerCanvasModeStore.setMode(null)
  fileInputRef.value?.click()
}
</script>

<template>
  <!-- 横向排列的圆形工具栏 -->
  <div class="flex items-center gap-2 p-2">
    <!-- 颜色选择器 -->
    <ColorPicker />
    <!-- 绘制模式按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2"
      :class="[
        mode === 'draw'
          ? 'bg-blue-500 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      ]"
      title="绘制模式"
      @click="() => setMode('draw')"
    >
      <span class="i-carbon-pen text-sm" />
    </button>
    
    <!-- 移动模式按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2"
      :class="[
        mode === 'move'
          ? 'bg-blue-500 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      ]"
      title="移动模式"
      @click="() => setMode('move')"
    >
      <img 
        src="/cc-hand.svg" 
        class="w-4 h-4" 
        :class="mode === 'move' ? 'brightness-0 invert' : ''"
        alt="移动" 
      />
    </button>
    
    <!-- 橡皮擦按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2"
      :class="[
        mode === 'erase'
          ? 'bg-blue-500 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      ]"
      title="橡皮擦"
      @click="() => setMode('erase')"
    >
      <span class="i-carbon-erase text-sm" />
    </button>
    
    <!-- 画框按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2"
      :class="[
        mode === 'rect'
          ? 'bg-blue-500 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      ]"
      title="画框"
      @click="() => setMode('rect')"
    >
      <span class="i-carbon-checkbox text-sm" />
    </button>
    
    <!-- 画圈按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2"
      :class="[
        mode === 'ellipse'
          ? 'bg-blue-500 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      ]"
      title="画圈"
      @click="() => setMode('ellipse')"
    >
      <span class="i-carbon-circle-outline text-sm" />
    </button>
    
    <!-- 上传Marker按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      title="上传标记"
      @click="triggerFileUpload"
    >
      <span class="i-carbon-upload text-sm" />
    </button>
    
    <!-- 清除按钮 -->
    <button
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-2 bg-red-500 text-white border-red-600 hover:bg-red-600"
      title="清除标记"
      @click="clearCanvas"
    >
      <span class="i-carbon-trash-can text-sm" />
    </button>
    
    
    
    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".png,.svg,image/png,image/svg+xml"
      multiple
      class="hidden"
      @change="handleFileUpload"
    />
  </div>
</template>

<style scoped>
/* 可以添加自定义样式 */
</style>
