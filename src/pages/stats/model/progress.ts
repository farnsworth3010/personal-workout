import { e1rm } from '@/entities/workout'
import type { Workout } from '@/shared/api'

import { byDate, workoutDate } from './dates'

export interface ProgressPoint {
  date: Date
  /** Heaviest logged weight; 0 for sets without weight. */
  topWeightKg: number
  volumeKg: number
  reps: number
}

interface Dated<T> {
  value: T
  date: Date
}

export interface ExerciseRecords {
  maxWeightKg: Dated<number> | null
  maxVolumeKg: Dated<number> | null
  bestSet: Dated<{ reps: number; weightKg: number; e1rmKg: number }> | null
}

// Weight, volume and reps only make sense for rep-based exercises.
const repBased = new Set(['strength', 'bodyweight'])

/** Rep-based exercises with logged sets, most recently done first. */
export function exercisesWithHistory(workouts: readonly Workout[]) {
  const seen = new Map<string, string>()
  for (const w of byDate(workouts).reverse()) {
    for (const e of w.entries) {
      if (repBased.has(e.kind) && e.sets.length > 0 && !seen.has(e.exerciseId)) {
        seen.set(e.exerciseId, e.name)
      }
    }
  }

  return [...seen].map(([exerciseId, name]) => ({ exerciseId, name }))
}

/** One point per workout with logged sets of the exercise, and the records with the day each was first set. */
export function exerciseProgress(workouts: readonly Workout[], exerciseId: string) {
  const points: ProgressPoint[] = []
  const records: ExerciseRecords = { maxWeightKg: null, maxVolumeKg: null, bestSet: null }

  for (const w of byDate(workouts)) {
    const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets)
    if (sets.length === 0) continue

    const date = workoutDate(w)
    const point: ProgressPoint = { date, topWeightKg: 0, volumeKg: 0, reps: 0 }
    for (const { reps = 0, weightKg = 0 } of sets) {
      // A failed 0-rep attempt is not a working weight, as in the finish screen's records.
      if (reps > 0) point.topWeightKg = Math.max(point.topWeightKg, weightKg)
      point.volumeKg += reps * weightKg
      point.reps += reps

      const e1rmKg = e1rm(weightKg, reps)
      if (weightKg > 0 && reps > 0 && e1rmKg > (records.bestSet?.value.e1rmKg ?? 0)) {
        records.bestSet = { value: { reps, weightKg, e1rmKg }, date }
      }
    }
    points.push(point)

    if (point.topWeightKg > (records.maxWeightKg?.value ?? 0)) {
      records.maxWeightKg = { value: point.topWeightKg, date }
    }
    if (point.volumeKg > (records.maxVolumeKg?.value ?? 0)) {
      records.maxVolumeKg = { value: point.volumeKg, date }
    }
  }

  return { points, records }
}
