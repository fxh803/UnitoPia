<template>
  <div
    class="min-h-screen w-screen flex flex-col bg-[var(--primary-light-color)] text-[var(--title-color)] dark:bg-gray-900 dark:text-gray-100"
    style="font-family: var(--font-sans);"
  >
    <MainHeader />

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-10 pb-16">
      <header class="mb-10 border-b border-[var(--border-color)] pb-6">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
          UnitoPia User Study
        </h1>
        
      </header>

      <!-- Study design -->
      <section class="mb-12 border-b border-[var(--border-color)] dark:border-gray-700 pb-10">
        <p
          class="text-[15px] leading-relaxed text-[var(--title-color)] dark:text-gray-200 max-w-none"
        >
          Participants first completed a demographics questionnaire, followed by a demonstration and training session (introducing the contain-and-fill model and practicing a walkthrough example). They then performed three reproduction tasks (each starting from a target image and encoding explanation, then recreating the design with provided dataset and assets), took a 10-minute break, and proceeded to a free-form exploration session. After both sessions, participants completed a 7-point Likert questionnaire and a short interview. The study was conducted in a standard web browser on a 13.3-inch Wacom pen tablet with differentiated pen and touch input. The tables below report per-question scores and aggregated statistics by design goal.
        </p>
      </section>

      <!-- Questionnaire -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold mb-2">
          Questionnaire results
        </h2>
        <p class="text-sm text-[var(--text-muted)] mb-4">
          {{ likertLabel }}. The table below shows each participant’s ratings for the 8 items, followed by per-item means and design-goal summaries (<em>M</em>/<em>SD</em>) computed from per-participant averages over the two items in each goal.
        </p>

        <div class="overflow-x-auto rounded-lg border border-[var(--border-color)] dark:border-gray-700 bg-white dark:bg-gray-800/50 mb-6">
          <table class="min-w-[720px] w-full text-sm text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th class="p-2.5 font-medium sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10 border-r border-[var(--border-color)]">
                  Participant
                </th>
                <th
                  v-for="q in questionItems"
                  :key="q.id"
                  class="p-2 font-medium text-center min-w-[4.5rem]"
                  :title="q.en"
                >
                  {{ q.id }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in participants"
                :key="row.id"
                class="border-t border-[var(--border-color)] dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
              >
                <td class="p-2.5 font-mono text-xs sticky left-0 bg-white dark:bg-gray-900/90 z-10 border-r border-[var(--border-color)] dark:border-gray-700">
                  {{ row.id }}
                </td>
                <td
                  v-for="(q, qi) in questionItems"
                  :key="`${row.id}-${q.id}`"
                  class="p-2 text-center tabular-nums"
                >
                  {{ row.scores[qi] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-base font-semibold mb-3">
          Per-item means (<em>n</em> = 9)
        </h3>
        <ul class="mb-6 space-y-2 text-sm">
          <li
            v-for="(q, qi) in questionItems"
            :key="q.id"
            class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-dashed border-[var(--border-color)] dark:border-gray-700 pb-2"
          >
            <span class="shrink-0 font-mono text-xs text-[var(--text-muted)] w-10">{{ q.id }}</span>
            <span class="flex-1">
              <span class="block text-[var(--title-color)] dark:text-gray-100">{{ q.en }}</span>
            </span>
            <span class="tabular-nums font-medium"><em>M</em> = {{ formatNum(questionMeans[qi]) }}</span>
          </li>
        </ul>

        <h3 class="text-base font-semibold mb-3">
          Design goals summary（per-participant average over two questions）
        </h3>
        <div class="overflow-x-auto rounded-lg border border-[var(--border-color)] dark:border-gray-700 bg-white dark:bg-gray-800/50 mb-8">
          <table class="min-w-[480px] w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/80 text-xs text-[var(--text-muted)]">
                <th class="p-3 text-left font-medium">
                  Design goal
                </th>
                <th class="p-3 text-right font-medium">
                  <em>M</em>
                </th>
                <th class="p-3 text-right font-medium">
                  <em>SD</em>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
              v-for="g in goalStats"
                :key="g.goal"
                class="border-t border-[var(--border-color)] dark:border-gray-700"
              >
                <td class="p-3">
                  {{ g.goal }}
                </td>
                <td class="p-3 text-right tabular-nums">
                  {{ formatNum(g.mean) }}
                </td>
                <td class="p-3 text-right tabular-nums">
                  {{ formatNum(g.sd) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Comments are omitted here because the source responses are in Chinese. -->
      </section>

      <!-- Phase 1 -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold mb-2">
          Phase 1: Reproduction
        </h2>
        <p class="text-sm text-[var(--text-muted)] mb-4">
          Below are the target images used in the three reproduction tasks, followed by each participant’s submissions.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <figure
            v-for="(src, i) in phase1Targets"
            :key="src"
            class="rounded-lg overflow-hidden border border-[var(--border-color)] dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
          >
            <div class="aspect-[4/3] bg-white flex items-center justify-center">
              <img
                :src="src"
                :alt="`Target ${i + 1}`"
                class="max-w-full max-h-full object-contain"
                loading="lazy"
              >
            </div>
            <figcaption class="px-3 py-2 text-xs text-center text-[var(--text-muted)]">
              Target {{ i + 1 }}
            </figcaption>
          </figure>
        </div>

        <div class="space-y-10">
            <article
              v-for="b in userStudyManifest.phase1"
              :key="`p1-${b.name}`"
              class="scroll-mt-24"
            >
              <h3 class="text-base font-semibold mb-3 border-l-4 border-[var(--primary-color)] pl-3">
                {{ b.name }}
              </h3>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  v-for="(src, idx) in b.images"
                  :key="src"
                  :href="src"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group rounded-lg overflow-hidden border border-[var(--border-color)] dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="aspect-[4/3] bg-white flex items-center justify-center p-2">
                    <img
                      :src="src"
                      :alt="`${b.name} work ${idx + 1}`"
                      class="max-w-full max-h-full object-contain group-hover:scale-[1.02] transition-transform"
                      loading="lazy"
                    >
                  </div>
                </a>
              </div>
            </article>
        </div>
      </section>

      <!-- Phase 2 -->
      <section>
        <h2 class="text-xl font-semibold mb-2">
          Phase 2: Free-form exploration
        </h2>
        <p class="text-sm text-[var(--text-muted)] mb-4">
          Exported works created during the free-form exploration session.
        </p>
        <div class="space-y-10">
          <article
            v-for="b in userStudyManifest.phase2"
            :key="`p2-${b.name}`"
            class="scroll-mt-24"
          >
            <h3 class="text-base font-semibold mb-3 border-l-4 border-[var(--primary-color)] pl-3">
              {{ b.name }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                v-for="(src, idx) in b.images"
                :key="src"
                :href="src"
                target="_blank"
                rel="noopener noreferrer"
                class="group rounded-lg overflow-hidden border border-[var(--border-color)] dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="aspect-[4/3] bg-white flex items-center justify-center p-2">
                  <img
                    :src="src"
                    :alt="`${b.name} work ${idx + 1}`"
                    class="max-w-full max-h-full object-contain group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  >
                </div>
              </a>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import MainHeader from '~/otherComponents/MainHeader.vue'
import { useUserStudyStore } from '~/stores/userstudy'

const userStudy = useUserStudyStore()
const {
  goalStats,
  likertLabel,
  participants,
  questionItems,
  questionMeans,
  userStudyManifest,
} = userStudy

const phase1Targets = [
  '/userStudyResult/环节1/target1.png',
  '/userStudyResult/环节1/target2.png',
  '/userStudyResult/环节1/target3.png',
] as const

function formatNum(n: number): string {
  return n.toFixed(2)
}
</script>
