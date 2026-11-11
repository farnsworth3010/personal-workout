import { e1rm } from '@/entities/workout'
import type { LoggedSet, Workout } from '@/shared/api'
import { n1 } from '@/shared/lib'

export type ExerciseState = 'done' | 'partial' | 'skipped'

export interface ExerciseRow {
  exerciseId: string
  name: string
  state: ExerciseState
  planned: number
  sets: LoggedSet[]
  volumeKg: number
  /** Index of the set with the highest estimated 1RM; null without weighted sets. */
  best: number | null
}

/** Entries in the order they were done, with their state, volume and best set. */
export function exerciseRows(workout: Workout): ExerciseRow[] {
  return workout.entries.map((entry) => {
    let best: number | null = null
    let bestE1rm = 0
    entry.sets.forEach(({ reps = 0, weightKg = 0 }, i) => {
      const estimate = e1rm(weightKg, reps)
      if (weightKg > 0 && reps > 0 && estimate > bestE1rm) {
        best = i
        bestE1rm = estimate
      }
    })

    return {
      exerciseId: entry.exerciseId,
      name: entry.name,
      state:
        entry.sets.length === 0
          ? 'skipped'
          : entry.sets.length < entry.plan.sets
            ? 'partial'
            : 'done',
      planned: entry.plan.sets,
      sets: entry.sets,
      volumeKg: entry.sets.reduce((v, s) => v + (s.reps ?? 0) * (s.weightKg ?? 0), 0),
      best,
    }
  })
}

/** "58:40", or "1:05:12" from an hour. */
export function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = (v: number) => String(v).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** "12 × 140 кг", "15 повт." or "45 с". */
export function formatSet({ reps, weightKg, durationSec }: LoggedSet) {
  if (durationSec !== undefined) return `${durationSec} с`
  if (weightKg) return `${reps ?? 0} × ${n1(weightKg)} кг`
  return `${reps ?? 0} повт.`
}

const time = (d: Date) => d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

/** "Среда, 11 ноября · 18:02–19:00" */
export function workoutWhen(workout: Workout) {
  const start = workout.startedAt.toDate()
  const day = start.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })
  const end = workout.endedAt ? `–${time(workout.endedAt.toDate())}` : ''
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time(start)}${end}`
}

export const wellbeingWords = ['плохо', 'так себе', 'средне', 'хорошо', 'отлично'] as const
export const energyWords = ['нет сил', 'мало сил', 'средне', 'бодро', 'полно сил'] as const

/** The body weight of the latest workout before this one that recorded it. */
export function previousBodyWeight(workout: Workout, history: readonly Workout[]) {
  const before = history
    .filter((w) => w.startedAt.toMillis() < workout.startedAt.toMillis())
    .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis())

  return before.find((w) => w.survey.bodyWeightKg !== undefined)?.survey.bodyWeightKg ?? null
}

/** "−0,3 кг к прошлому разу", "как в прошлый раз" or null without a previous weight. */
export function weightChange(kg: number, previous: number | null) {
  if (previous === null) return null

  const d = Math.round((kg - previous) * 10) / 10
  if (d === 0) return 'как в прошлый раз'
  return `${d > 0 ? '+' : '−'}${n1(Math.abs(d))} кг к прошлому разу`
}
