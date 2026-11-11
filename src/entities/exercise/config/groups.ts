import type { Muscle } from '@/shared/api'

// The seven chips of exercises.html; neck goes with the back because traps sit there.
export const muscleGroups = {
  chest: { label: 'Грудь', muscles: ['chest'] },
  back: { label: 'Спина', muscles: ['lats', 'middle back', 'lower back', 'traps', 'neck'] },
  shoulders: { label: 'Плечи', muscles: ['shoulders'] },
  arms: { label: 'Руки', muscles: ['biceps', 'triceps', 'forearms'] },
  legs: {
    label: 'Ноги',
    muscles: ['quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'],
  },
  glutes: { label: 'Ягодицы', muscles: ['glutes'] },
  abs: { label: 'Пресс', muscles: ['abdominals'] },
} satisfies Record<string, { label: string; muscles: Muscle[] }>

export type MuscleGroup = keyof typeof muscleGroups
