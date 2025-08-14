<script setup lang="ts">
import { useCanvasModeStore } from '~/stores/canvasMode'
import { storeToRefs } from 'pinia'

const canvasModeStore = useCanvasModeStore() 
const { mode } = storeToRefs(canvasModeStore)
const { setMode, clearCanvas } = canvasModeStore
</script>

<template>
  <div class="px-2 py-4 border border-[#e6e6e6] rounded-xl bg-white flex flex-col gap-3 shadow right-6 top-1/2 absolute z-10 -translate-y-1/2">
    <button
      class="rounded flex h-10 w-10 items-center justify-center "
      :class="[
        'rounded flex h-10 w-10 items-center justify-center',
        mode === 'draw'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Draw"
      @click="() => setMode('draw')"
    >
      <span class="i-carbon-pen" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center "
      :class="[
        'rounded flex h-10 w-10 items-center justify-center',
        mode === 'move'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Move"
      @click="() => setMode('move')"
    >
      <span class="i-carbon-move" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center "
      :class="[
        'rounded flex h-10 w-10 items-center justify-center',
        mode === 'erase'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Eraser"
      @click="() => setMode('erase')"
    >
      <span class="i-carbon-erase" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center "
      :class="[
        'rounded flex h-10 w-10 items-center justify-center',
        mode === 'rect'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Rectangle"
      @click="() => setMode('rect')"
    >
      <span class="i-carbon:checkbox" />
    </button>
    <button
      class="rounded flex h-10 w-10 items-center justify-center "
      :class="[
        'rounded flex h-10 w-10 items-center justify-center',
        mode === 'ellipse'
          ? 'bg-[#0d99ff] text-white'
          : 'bg-white text-black hover:bg-[#f5f5f5]'
      ]"
      title="Ellipse"
      @click="() => setMode('ellipse')"
    >
      <span class="i-carbon-circle-outline" />
    </button>
    <button
      class="text-white rounded bg-red-600 flex h-10 w-10 items-center justify-center hover:bg-red-700"
      title="Clear Canvas"
      @click="clearCanvas"
    >
      <span class="i-carbon-trash-can" />
    </button>
  </div>
</template>
