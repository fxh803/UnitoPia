import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export interface TableData {
  [key: string]: any
}

export const useTableStore = defineStore('table', () => {
  // 表格数据状态
  const tableData = ref<TableData[]>([])
  const tableColumns = ref<string[]>([])
  const fileName = ref<string>('')
  const isLoading = ref(false)
  // 解析 CSV 行
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const maxRows = 300 // 限制最大行数

  /** 从 CSV 文本解析出 data 和 columns */
  const parseCSVText = (text: string): { data: TableData[]; headers: string[] } => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { data: [], headers: [] }
    const headers = parseCSVLine(lines[0])
    const data: TableData[] = []
    const rowsToProcess = Math.min(lines.length - 1, maxRows)
    for (let i = 1; i <= rowsToProcess; i++) {
      const values = parseCSVLine(lines[i])
      const row: TableData = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
    return { data, headers }
  }

  /** 从 URL 加载预制 CSV（如 public/csv/xxx.csv） */
  const loadFromUrl = async (url: string, displayName: string) => {
    try {
      isLoading.value = true
      const base = import.meta.env.BASE_URL.replace(/\/$/, '')
      const fullUrl = url.startsWith('/') ? base + url : base + '/' + url
      const res = await fetch(fullUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const { data, headers } = parseCSVText(text)
      if (headers.length === 0 || data.length === 0) {
        ElMessage.error('CSV is empty')
        return
      }
      tableData.value = data
      tableColumns.value = headers
      fileName.value = displayName
      ElMessage.success(`Loaded ${displayName}, ${data.length} rows`)
    } catch (error) {
      ElMessage.error('Failed to load preset data')
      console.error('Load CSV from URL error:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      ElMessage.error('Please upload a CSV file')
      return
    }

    try {
      isLoading.value = true
      const text = await file.text()
      const { data, headers } = parseCSVText(text)

      if (headers.length === 0 || data.length === 0) {
        ElMessage.error('CSV file is empty')
        return
      }

      tableData.value = data
      tableColumns.value = headers
      fileName.value = file.name

      const totalRows = text.split('\n').filter(l => l.trim()).length - 1
      const loadedRows = data.length
      ElMessage.success(`Successfully uploaded ${file.name}, loaded ${loadedRows} rows${totalRows > maxRows ? ` (${totalRows} total rows, showing first ${maxRows} rows)` : ''}`)
    } catch (error) {
      ElMessage.error('File parsing failed')
      console.error('CSV parsing error:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 清空表格数据
  const clearTableData = () => {
    tableData.value = []
    tableColumns.value = []
    fileName.value = ''
  }

  // 设置表格数据
  const setTableData = (data: TableData[], columns: string[]) => {
    tableData.value = data
    tableColumns.value = columns
  }

  return {
    // 状态
    tableData,
    tableColumns,
    fileName,
    isLoading,
    // 方法
    handleFileUpload,
    loadFromUrl,
    clearTableData,
    setTableData
  }
})
