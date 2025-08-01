<script setup lang="ts">
import { ref, watch } from 'vue'
import { useColorPickerStore } from '~/stores/colorpicker'

const colorPickerStore = useColorPickerStore()
const colorPickerRef = ref<HTMLInputElement>()

// 选择颜色
const selectColor = (color: string) => {
  colorPickerStore.setSelectedColor(color)
}

// 打开颜色选择器
const openColorPicker = () => {
  colorPickerRef.value?.click()
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
      class="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
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
      style="position: absolute; top: -200px; left: -250px;"
    />
  </div>
</template>

 