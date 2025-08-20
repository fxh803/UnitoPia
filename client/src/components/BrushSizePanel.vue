<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBrushSizeStore } from '~/stores/brushsize'

// 定义组件属性
interface Props {
  canvasType?: 'main' | 'sub' // 画布类型：主画布或子画布
}

const props = withDefaults(defineProps<Props>(), {
  canvasType: 'main' // 默认为主画布
})

const brushSizeStore = useBrushSizeStore()
const {brushWidth} = storeToRefs(brushSizeStore) 

const min = 1
const max = 50

// 根据画布类型计算面板位置
const panelPosition = computed(() => {
  if (props.canvasType === 'sub') {
    return {
      top: '60px', // 子画布下位置更高
      right: '20px'
    }
  }
  return {
    top: '16px', // 主画布下保持原位置
    right: '16px'
  }
})
</script>

<template>
  <div class="brush-size-panel fixed-panel shadow" :style="panelPosition">
    <label class="label">Brush Size:</label>
    <input
      type="range"
      :min="min"
      :max="max"
      v-model="brushWidth"
      class="slider"
    />
    <span class="value">{{ brushWidth }}</span>
  </div>
</template>

<style scoped>
.brush-size-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 8px 0;
  color: #fff;
}
.fixed-panel {
  position: absolute;
  z-index: 20; 
} 
.label {
  font-size: 14px;
  color: #aaa;
}
.slider {
  width: 100px; 
  accent-color: #0d99ff; 
}
.value {
  min-width: 24px;
  text-align: right;
  font-family: monospace;
  color: black;
} 
</style> 