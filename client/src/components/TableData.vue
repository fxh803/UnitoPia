<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTableStore } from '~/stores/table'
import { useMarkInstanceStore } from '~/stores/markInstance'

const tableStore = useTableStore()

// 根据当前所有 mark 实例（single + child）计算每一行应该使用的高亮类名
const markInstanceStore = useMarkInstanceStore()
const { markInstances } = storeToRefs(markInstanceStore)

const rowHighlightClass = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {}

  let colorCounter = 0

  for (const mark of markInstances.value) {
    // 单实例：直接使用自身的 entityIndices
    if (!mark.isGroup) {
      const indices = mark.entityIndices || []
      if (!indices.length) continue
      const cls = `highlight-row-${colorCounter % 8}`
      colorCounter++

      for (const idx of indices) {
        if (map[idx] === undefined) {
          map[idx] = cls
        }
      }
      continue
    }

    // group：为每个子实例单独分配颜色
    if (mark.children && mark.children.length > 0) {
      for (const child of mark.children) {
        const indices = child.entityIndices || []
        if (!indices.length) continue

        const cls = `highlight-row-${colorCounter % 8}`
        colorCounter++

        for (const idx of indices) {
          if (map[idx] === undefined) {
            map[idx] = cls
          }
        }
      }
    }
  }

  return map
})

// 行类名处理：按行索引查找是否需要高亮（整行高亮，性能更好）
const rowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowHighlightClass.value[rowIndex] || ''
}
</script>

<template>
  <!-- 数据表格区域 - 只在有数据时显示 -->
  <div class="flex-1 w-full overflow-hidden flex flex-col"
    style="min-width: 0; min-height: 0; max-width: 100%; max-height: 100%;">
    <!-- 表格内容 -->
    <div class="flex-1 overflow-hidden">
        <vxe-table
          :data="tableStore.tableData"
          :scroll-y="{ enabled: true }"
          :scroll-x="{ enabled: true }"
          height="100%"
          :cell-config="{ height: 30 }"
          show-header-overflow
          show-overflow
          size="small"
          border
          :row-class-name="rowClassName"
          :auto-resize="true"
          :column-config="{ resizable: true }"
        >
        <vxe-column v-for="(item, index) in tableStore.tableColumns" :key="index" :field="item" :title="item"
          header-align="center"
          :min-width="item.toLowerCase() === 'index' || item.toLowerCase() === 'idx' ? 20 : 40">
        </vxe-column>
      </vxe-table>
    </div>
  </div>
</template>

<style>
/* 为不同的 mark 实例定义不同的整行背景颜色 */
.highlight-row-0 .vxe-cell {
  background-color: rgba(166, 206, 227, 0.5);
  font-weight: bold;
}

.highlight-row-1 .vxe-cell {
  background-color: rgba(178, 223, 138, 0.5);
  font-weight: bold;
}

.highlight-row-2 .vxe-cell {
  background-color: rgba(251, 154, 153, 0.5);
  font-weight: bold;
}

.highlight-row-3 .vxe-cell {
  background-color: rgba(253, 191, 111, 0.5);
  font-weight: bold;
}

.highlight-row-4 .vxe-cell {
  background-color: rgba(202, 178, 214, 0.5);
  font-weight: bold;
}

.highlight-row-5 .vxe-cell {
  background-color: rgba(255, 255, 153, 0.5);
  font-weight: bold;
}

.highlight-row-6 .vxe-cell {
  background-color: rgba(141, 211, 199, 0.5);
  font-weight: bold;
}

.highlight-row-7 .vxe-cell {
  background-color: rgba(252, 205, 229, 0.5);
  font-weight: bold;
}

.vxe-cell--title{
  width: 100%;
}
</style>

