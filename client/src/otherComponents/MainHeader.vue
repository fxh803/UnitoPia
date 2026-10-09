<template>
  <header
    class="sticky top-0 z-50 w-full h-16 flex items-center justify-between px-10 py-4 shadow-sm bg-white/95 backdrop-blur dark:bg-gray-900/95"
  >
    <div class="flex items-center space-x-2">
      <span class="text-2xl font-bold tracking-wide text-[var(--title-color)]">UnitoPia</span>
    </div>

    <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-[var(--text-muted)] dark:text-gray-300">
      <button
        class="hover:text-[var(--primary-color)] transition-colors cursor-pointer"
        @click="goHome"
      >
        Home
      </button>
      <button
        class="hover:text-[var(--primary-color)] transition-colors cursor-pointer"
        @click="goToGallery"
      >
        Gallery
      </button>
      <button
        class="hover:text-[var(--primary-color)] transition-colors cursor-pointer"
        @click="goToGetStarted"
      >
        Get Started
      </button>
      <button class="hover:text-[var(--primary-color)] transition-colors cursor-pointer" @click="goToDataset">
        Datasets
      </button>
      <button
        class="hover:text-[var(--primary-color)] transition-colors cursor-pointer"
        @click="goToUserStudy"
      >
        User Study
      </button>
    </nav>

    <div class=" flex items-center gap-5">
      <a
        href="https://github.com/SZUVIZ/UnitoPia"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center hover:text-[var(--text-muted)] transition-colors"
        aria-label="Source Code"
      >
        <span class="i-carbon:logo-github text-3xl" aria-hidden="true" />
      </a>
      <button
        type="button"
        class="inline-flex items-center justify-center hover:text-[var(--text-muted)] transition-colors cursor-pointer"
        aria-label="Paper"
        @click="goToPaper"
      >
        <svg
          class="w-5 h-5 text-[#FF0000] transition-transform hover:scale-110"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M23.63 15.3c-.71-.745-2.166-1.17-4.224-1.17c-1.1 0-2.377.106-3.761.354a19.4 19.4 0 0 1-2.307-2.661c-.532-.71-.994-1.49-1.42-2.236c.817-2.484 1.207-4.507 1.207-5.962c0-1.632-.603-3.336-2.342-3.336c-.532 0-1.065.32-1.349.781c-.78 1.384-.425 4.4.923 7.381a60 60 0 0 1-1.703 4.507c-.568 1.349-1.207 2.733-1.917 4.01C2.834 18.53.314 20.34.03 21.758c-.106.533.071 1.03.462 1.42c.142.107.639.533 1.49.533c2.59 0 5.323-4.188 6.707-6.707c1.065-.355 2.13-.71 3.194-.994a35 35 0 0 1 3.407-.745c2.732 2.448 5.145 2.839 6.352 2.839c1.49 0 2.023-.604 2.2-1.1c.32-.64.106-1.349-.213-1.704zm-1.42 1.03c-.107.532-.64.887-1.384.887c-.213 0-.39-.036-.604-.071c-1.348-.32-2.626-.994-3.903-2.059a18 18 0 0 1 2.98-.248c.746 0 1.385.035 1.81.142c.497.106 1.278.426 1.1 1.348zm-7.524-1.668a38 38 0 0 0-2.945.674a40 40 0 0 0-2.52.745a40 40 0 0 0 1.207-2.555c.426-.994.78-2.023 1.136-2.981c.354.603.745 1.207 1.135 1.739a50 50 0 0 0 1.987 2.378M10.038 1.46a.77.77 0 0 1 .674-.425c.745 0 .887.851.887 1.526c0 1.135-.355 2.874-.958 4.861c-1.03-2.768-1.1-5.074-.603-5.962M6.134 17.997c-1.81 2.981-3.549 4.826-4.613 4.826a.87.87 0 0 1-.532-.177c-.213-.213-.32-.461-.249-.745c.213-1.065 2.271-2.555 5.394-3.904" />
        </svg>
      </button>
      <button
        class="inline-flex items-center rounded-full border border-[var(--primary-color)] px-4 py-1.5 text-sm font-semibold text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-colors cursor-pointer"
        @click="goEditorFresh"
      >
        Try Online
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const EDITOR_FRESH_KEY = 'unitopia-editor-fresh-once'

const navigateByBrowser = (path: string) => {
  if (typeof window === 'undefined')
    return
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const currentPath = window.location.pathname
  const documentPath = currentPath.endsWith('index.html')
    ? currentPath
    : `${currentPath.replace(/\/$/, '')}/index.html`
  window.location.assign(`${window.location.origin}${documentPath}#${normalizedPath}`)
}

const goHome = () => {
  navigateByBrowser('/')
}

const goToGallery = () => {
  navigateByBrowser('/gallery')
}

const goToDataset = () => {
  navigateByBrowser('/dataset')
}

const goToUserStudy = () => {
  navigateByBrowser('/userstudy')
}

const goToGetStarted = () => {
  navigateByBrowser('/getStarted')
}

const goToPaper = () => {
  navigateByBrowser('/paper')
}

const goEditorFresh = () => {
  if (typeof window !== 'undefined')
    window.sessionStorage.setItem(EDITOR_FRESH_KEY, '1')
  navigateByBrowser('/editor')
}
</script>

<style scoped>
</style>

