<template>
  <div
    class="min-h-screen w-screen flex flex-col bg-[var(--primary-light-color)] text-[var(--title-color)] dark:bg-gray-900 dark:text-gray-100"
    style="font-family: var(--font-sans);"
  >
    <MainHeader />

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-10">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight mb-3">
        Source Code
      </h1>
      <p class="text-sm text-[var(--text-muted)]">
        This page is currently empty. Content will be added soon.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import MainHeader from '~/otherComponents/MainHeader.vue'
</script>
