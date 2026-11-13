import type { LoggedSet, Workout } from '@/shared/api'
import { clockTime, longDate, n1 } from '@/shared/lib'

/** "12 × 140 кг", "15 повт." or "45 с". */
export function formatSet({ reps, weightKg, durationSec }: LoggedSet) {
  if (durationSec !== undefined) return `${durationSec} с`
  if (weightKg) return `${reps ?? 0} × ${n1(weightKg)} кг`
  return `${reps ?? 0} повт.`
}

/** "Среда, 11 ноября · 18:02–19:00" */
export function workoutWhen(workout: Workout) {
  const start = workout.startedAt.toDate()
  const end = workout.endedAt ? `–${clockTime(workout.endedAt.toDate())}` : ''
  return `${longDate(start)} · ${clockTime(start)}${end}`
}
