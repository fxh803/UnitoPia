import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTutorialStore = defineStore('tutorial', () => {
  const isTutorialOpen = ref(false)

  function openTutorial() {
    isTutorialOpen.value = true
  }

  function closeTutorial() {
    isTutorialOpen.value = false
  }

  function toggleTutorial() {
    isTutorialOpen.value = !isTutorialOpen.value
  }

  return {
    isTutorialOpen,
    openTutorial,
    closeTutorial,
    toggleTutorial
  }
})
