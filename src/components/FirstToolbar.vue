<script setup lang="ts">
import { defineProps, ref, defineEmits, watch } from 'vue'

const props = defineProps<{
  selectedModeType?: 'marker' | 'container' | null
}>()

const emit = defineEmits<{
  modeTypeChange: [type: 'marker' | 'container' | null]
}>()

// 当前选中的模式类型
const selectedModeType = ref(props.selectedModeType || null)

// 监听外部模式类型变化
watch(() => props.selectedModeType, (newType) => {
  if (newType !== undefined) {
    selectedModeType.value = newType
  }
})

// 选择模式类型
const selectModeType = (type: 'marker' | 'container') => {
  // 如果点击的是当前已选中的模式，则取消选择
  if (selectedModeType.value === type) {
    selectedModeType.value = null
    emit('modeTypeChange', null)
  } else {
    selectedModeType.value = type
    emit('modeTypeChange', type)
  }
}
</script>

<template>
  <!-- 一级工具栏：模式选择 -->
  <div class="px-2 py-4 border border-[#e6e6e6] rounded-xl bg-white flex flex-col gap-3 shadow left-6 top-1/2 absolute z-10 -translate-y-1/2">
    <button
      class="rounded flex h-10 w-10 items-center justify-center"
      :class="[
        selectedModeType === 'marker'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Marker Mode"
      @click="selectModeType('marker')"
    >
      <span class="i-carbon-pen" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center"
      :class="[
        selectedModeType === 'container'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Container Mode"
      @click="selectModeType('container')"
    >
      <span class="i-carbon-view" />
    </button>
  </div>
</template>

<style scoped>
.i-carbon-pen::before {
  content: '\f1c6';
  font-family: 'carbon-icons';
}
.i-carbon-view::before {
  content: '\f1b3';
  font-family: 'carbon-icons';
}
</style> 