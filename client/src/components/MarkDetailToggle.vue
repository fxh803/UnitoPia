<script setup lang="ts">
const props = defineProps<{
  /** 当前详情面板是否展开 */
  open: boolean
  /** 是否可用（没有选中 mark 时禁用） */
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <div
    class="h-full flex items-center bg-[var(--primary-muted-color)] border-l border-r border-[var(--border-color)]"
  >
    <button
      type="button"
      class="h-[200px] w-3 mx-auto flex items-center justify-center bg-[var(--primary-light-color)] hover:bg-[var(--primary-light-color)]/70 transition-colors disabled:opacity-40 disabled:cursor-default"
      :disabled="props.disabled"
      @click="emit('toggle')"
    >
      <span
        class="text-xs text-[var(--text-muted)]"
        :class="props.open ? 'i-carbon-chevron-left' : 'i-carbon-chevron-right'"
      />
    </button>
  </div>
</template>

