<script setup lang="ts">
import { defineProps, ref, defineEmits, watch } from 'vue'

const props = defineProps<{
  show?: boolean
}>()

const emit = defineEmits<{
  colorChange: [color: string]
}>()

const selectedColor = ref('#000000')
const colorPickerRef = ref<HTMLInputElement>()



// 选择颜色
const selectColor = (color: string) => {
  selectedColor.value = color
  emit('colorChange', color)
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
  <div v-if="show" class="flex justify-center">
    <button
      class="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
      :style="{ backgroundColor: selectedColor }"
      title="Color Picker"
      @click="openColorPicker"
    > 
    </button>
    <!-- 隐藏的原生颜色选择器 -->
    <input
      ref="colorPickerRef"
      type="color"
      :value="selectedColor"
      @change="handleColorChange"
      class="hidden"
    />
  </div>
</template>

 