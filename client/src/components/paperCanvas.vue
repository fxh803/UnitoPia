<script setup lang="ts">
import { ref } from 'vue'
import paper from 'paper'
const paperCanvasRef = ref<HTMLCanvasElement | null>(null)
onMounted(() => {
    nextTick(() => {
        // 绑定 Paper.js 到 canvas
        paper.setup(paperCanvasRef.value);
        const canvasSize = document.querySelector('.canvas-wrapper')?.getBoundingClientRect()
        const width = Math.floor(canvasSize.width);
        const height = Math.floor(canvasSize.height);
        // 保证宽高比 1:1
        const size = Math.min(width, height);
        paperCanvasRef.value.width = size
        paperCanvasRef.value.height = size
        paper.view.viewSize = new paper.Size(size, size);
    });
});
</script>

<template>
    <canvas ref="paperCanvasRef" class="absolute top-0 left-0 paper-canvas rounded-xl bg-white" />
</template>