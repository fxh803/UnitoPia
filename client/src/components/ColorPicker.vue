<script setup lang="ts">
import { ref } from 'vue'
import { useColorPickerStore } from '~/stores/colorpicker'

const colorPickerStore = useColorPickerStore()
const colorPickerRef = ref<HTMLInputElement>()

// 选择颜色
const selectColor = (color: string) => {
  colorPickerStore.setSelectedColor(color)
}

// 打开颜色选择器
const openColorPicker = () => {
  colorPickerStore.setColorPickerOpen(true)
  colorPickerRef.value?.click()

  // 检查颜色选择器是否仍然打开
  const checkColorPickerClosed = () => {
    // 如果 document.activeElement 不是颜色选择器，说明已关闭
    if (document.activeElement !== colorPickerRef.value) {
      // 延迟一点时间再检查，确保颜色选择器确实关闭了
      setTimeout(() => {
        if (document.activeElement !== colorPickerRef.value) {
          colorPickerStore.setColorPickerOpen(false)
        }
      }, 100)
    }
  }
  
  // 监听点击事件，检测颜色选择器是否关闭
  const handleClick = () => {
    checkColorPickerClosed()
  }
  
  // 监听窗口焦点变化
  const handleFocus = () => {
    checkColorPickerClosed()
  }
  
  // 添加事件监听器
  setTimeout(() => {
    document.addEventListener('click', handleClick, { once: true, capture: true })
    window.addEventListener('focus', handleFocus, { once: true })
  }, 100)
}

// 处理颜色变化
const handleColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectColor(target.value)
}
</script>

<template>
  <div class="flex justify-center relative">
    <button
      class="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
      :style="{ backgroundColor: colorPickerStore.selectedColor }"
      title="Color Picker"
      @click="openColorPicker"
    > 
    </button>
    <!-- 隐藏的原生颜色选择器 -->
    <input
      ref="colorPickerRef"
      type="color"
      :value="colorPickerStore.selectedColor"
      @change="handleColorChange"
      class="absolute opacity-0 pointer-events-none"
      style="position: absolute; top: -300px; left: 50px;"
    />
  </div>
</template>

 