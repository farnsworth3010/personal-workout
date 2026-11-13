import type { ExerciseKind } from '@/shared/api'

// Cardio is planned in minutes, timed exercises in seconds; both are stored as durationSec.
export const amountLabel = (kind: ExerciseKind) =>
  ({ strength: 'Повторы', bodyweight: 'Повторы', timed: 'Секунды', cardio: 'Минуты' })[kind]
