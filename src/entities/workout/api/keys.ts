import type { HistoryRange } from '../model/types'

// Every query key of the slice; `workouts` keys hold lists, `workout` keys one document.
export const workoutKeys = {
  history: (uid: string, { from, to }: HistoryRange) =>
    ['workouts', uid, from.getTime(), to.getTime()] as const,
  recent: (uid: string) => ['workouts', uid, 'recent'] as const,
  one: (uid: string, workoutId: string) => ['workout', uid, workoutId] as const,
  active: (uid: string) => ['workout', uid, 'active'] as const,
  exerciseStats: (uid: string) => ['exerciseStats', uid] as const,
}
