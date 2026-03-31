import { defineStore } from 'pinia'

export interface QuestionnaireRow {
  id: string
  order: number
  /** anonymized code (same as id) */
  name: string
  scores: readonly [number, number, number, number, number, number, number, number]
}

export interface UserStudyBlock {
  name: string
  images: string[]
}

export const useUserStudyStore = defineStore('userstudy', () => {
  const likertLabel = '7-point Likert scale (1 = strongly disagree, 7 = strongly agree)'

  const questionItems: readonly {
    id: string
    en: string
    goal: string
  }[] = [
    {
      id: 'Q1.1',
      en: 'Q1.1 [Rich Marks]: The system allowed me to use visually rich, irregular marks as I want.',
      goal: 'DG1: Visual Richness',
    },
    {
      id: 'Q1.2',
      en: 'Q1.2 [Visual Quality]: The system preserves good visual qualities and textures in my marks.',
      goal: 'DG1: Visual Richness',
    },
    {
      id: 'Q2.1',
      en: 'Q2.1 [Non-Grid Creation]: I could easily create non-grid layouts (circular, freeform, organic organization).',
      goal: 'DG2: Non-Grid Layouts',
    },
    {
      id: 'Q2.2',
      en: 'Q2.2 [Organic Appearance]: The layouts produced looked natural, as if objects had gathered organically.',
      goal: 'DG2: Non-Grid Layouts',
    },
    {
      id: 'Q3.1',
      en: 'Q3.1 [Concept Clarity]: The container-emitter-force concepts were easy to understand.',
      goal: 'DG3: Intuitive Authoring',
    },
    {
      id: 'Q3.2',
      en: 'Q3.2 [Metaphor Alignment]: I could specify layouts using intuitive metaphors aligned with how I naturally think about arranging objects.',
      goal: 'DG3: Intuitive Authoring',
    },
    {
      id: 'Q4.1',
      en: 'Q4.1 [Encoding Preservation]: Data-determined visual encoding (color, size) survived layout optimization.',
      goal: 'DG4: Data Fidelity',
    },
    {
      id: 'Q4.2',
      en: 'Q4.2 [Trust in Representation]: I trust that the final arrangement faithfully represents the underlying data.',
      goal: 'DG4: Data Fidelity',
    },
  ] as const

  const participants: QuestionnaireRow[] = [
    { id: 'D1', order: 1, name: 'D1', scores: [7, 5, 7, 6, 7, 6, 7, 6] },
    { id: 'D2', order: 2, name: 'D2', scores: [6, 5, 6, 4, 6, 6, 5, 7] },
    { id: 'D3', order: 3, name: 'D3', scores: [6, 6, 7, 6, 6, 7, 6, 6] },
    { id: 'D4', order: 4, name: 'D4', scores: [5, 6, 5, 6, 6, 5, 6, 5] },
    { id: 'D5', order: 5, name: 'D5', scores: [6, 7, 6, 4, 5, 6, 6, 6] },
    { id: 'P1', order: 6, name: 'P1', scores: [6, 7, 7, 6, 7, 7, 7, 6] },
    { id: 'P2', order: 7, name: 'P2', scores: [7, 7, 7, 7, 7, 7, 7, 7] },
    { id: 'P3', order: 8, name: 'P3', scores: [7, 7, 7, 7, 7, 7, 7, 7] },
    { id: 'P4', order: 9, name: 'P4', scores: [7, 7, 7, 7, 7, 7, 7, 7] },
  ]

  function mean(values: number[]): number {
    if (values.length === 0)
      return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const questionMeans: number[] = questionItems.map((_, qi) =>
    mean(participants.map(p => p.scores[qi])),
  )

  function goalMeanSd(pair: readonly [number, number]): { mean: number; sd: number } {
    const perParticipant = participants.map((p) => {
      const a = p.scores[pair[0]]
      const b = p.scores[pair[1]]
      return (a + b) / 2
    })
    const m = mean(perParticipant)
    const variance
      = perParticipant.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(perParticipant.length - 1, 1)
    return { mean: m, sd: Math.sqrt(variance) }
  }

  const goalStats: { goal: string; mean: number; sd: number }[] = [
    { goal: 'DG1: Visual Richness (Q1.1–Q1.2)', ...goalMeanSd([0, 1]) },
    { goal: 'DG2: Non-Grid Layouts (Q2.1–Q2.2)', ...goalMeanSd([2, 3]) },
    { goal: 'DG3: Intuitive Authoring (Q3.1–Q3.2)', ...goalMeanSd([4, 5]) },
    { goal: 'DG4: Data Fidelity (Q4.1–Q4.2)', ...goalMeanSd([6, 7]) },
  ]

  const userStudyManifest: { phase1: UserStudyBlock[]; phase2: UserStudyBlock[] } = {
    phase1: [
      { name: 'D1', images: ['/userStudyResult/环节1/D1/1.png', '/userStudyResult/环节1/D1/2.png', '/userStudyResult/环节1/D1/3.png'] },
      { name: 'D2', images: ['/userStudyResult/环节1/D2/1.png', '/userStudyResult/环节1/D2/2.png', '/userStudyResult/环节1/D2/3.png'] },
      { name: 'D3', images: ['/userStudyResult/环节1/D3/1.png', '/userStudyResult/环节1/D3/2.png', '/userStudyResult/环节1/D3/3.png'] },
      { name: 'D4', images: ['/userStudyResult/环节1/D4/1.png', '/userStudyResult/环节1/D4/2.png', '/userStudyResult/环节1/D4/3.png'] },
      { name: 'D5', images: ['/userStudyResult/环节1/D5/1.png', '/userStudyResult/环节1/D5/2.png', '/userStudyResult/环节1/D5/3.png'] },
      { name: 'P1', images: ['/userStudyResult/环节1/P1/1.png', '/userStudyResult/环节1/P1/2.png', '/userStudyResult/环节1/P1/3.png'] },
      { name: 'P2', images: ['/userStudyResult/环节1/P2/1.png', '/userStudyResult/环节1/P2/2.png', '/userStudyResult/环节1/P2/3.png'] },
      { name: 'P3', images: ['/userStudyResult/环节1/P3/1.png', '/userStudyResult/环节1/P3/2.png', '/userStudyResult/环节1/P3/3.png'] },
      { name: 'P4', images: ['/userStudyResult/环节1/P4/1.png', '/userStudyResult/环节1/P4/2.png', '/userStudyResult/环节1/P4/3.png'] },
    ],
    phase2: [
      { name: 'D1', images: ['/userStudyResult/环节2/D1/1.png', '/userStudyResult/环节2/D1/2.png', '/userStudyResult/环节2/D1/3.png'] },
      { name: 'D2', images: ['/userStudyResult/环节2/D2/1.png', '/userStudyResult/环节2/D2/2.png', '/userStudyResult/环节2/D2/3.png'] },
      { name: 'D3', images: ['/userStudyResult/环节2/D3/1.png', '/userStudyResult/环节2/D3/2.png', '/userStudyResult/环节2/D3/3.png'] },
      { name: 'D4', images: ['/userStudyResult/环节2/D4/1.png', '/userStudyResult/环节2/D4/2.png', '/userStudyResult/环节2/D4/3.png'] },
      { name: 'D5', images: ['/userStudyResult/环节2/D5/1.png', '/userStudyResult/环节2/D5/2.png', '/userStudyResult/环节2/D5/3.png'] },
      { name: 'P1', images: ['/userStudyResult/环节2/P1/1.png', '/userStudyResult/环节2/P1/2.png', '/userStudyResult/环节2/P1/3.png'] },
      { name: 'P2', images: ['/userStudyResult/环节2/P2/1.png', '/userStudyResult/环节2/P2/2.png', '/userStudyResult/环节2/P2/3.png'] },
      { name: 'P3', images: ['/userStudyResult/环节2/P3/1.png', '/userStudyResult/环节2/P3/2.png', '/userStudyResult/环节2/P3/3.png'] },
      { name: 'P4', images: ['/userStudyResult/环节2/P4/1.png', '/userStudyResult/环节2/P4/2.png', '/userStudyResult/环节2/P4/3.png'] },
    ],
  }

  return {
    likertLabel,
    questionItems,
    participants,
    questionMeans,
    goalStats,
    userStudyManifest,
  }
})

