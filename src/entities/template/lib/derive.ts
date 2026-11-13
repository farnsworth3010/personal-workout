import type { Equipment, ExerciseKind, Muscle, TemplateEntry } from '@/shared/api'

import type { Place } from '../model/types'

// The exercise data the derivations need; entities/exercise satisfies it structurally.
export interface ExerciseFacts {
  kind: ExerciseKind
  primaryMuscles: readonly Muscle[]
  equipment: Equipment | null
}

export type ExerciseFactsById = Readonly<Record<string, ExerciseFacts | undefined>>

interface HasEntries {
  entries: readonly TemplateEntry[]
}

const SECONDS_PER_REP = 4
const SECONDS_PER_EXERCISE = 60

export const usesDuration = (kind: ExerciseFacts['kind']) => kind === 'timed' || kind === 'cardio'

export function needsGym(exercise: ExerciseFacts, homeEquipment: readonly Equipment[]) {
  const { equipment } = exercise

  return equipment !== null && equipment !== 'body only' && !homeEquipment.includes(equipment)
}

export function gymOnlyCount(
  template: HasEntries,
  exercisesById: ExerciseFactsById,
  homeEquipment: readonly Equipment[],
) {
  return template.entries.filter((entry) => {
    const exercise = exercisesById[entry.exerciseId]

    return exercise !== undefined && needsGym(exercise, homeEquipment)
  }).length
}

export function placeOf(
  template: HasEntries,
  exercisesById: ExerciseFactsById,
  homeEquipment: readonly Equipment[],
): Place {
  return gymOnlyCount(template, exercisesById, homeEquipment) > 0 ? 'gym' : 'home'
}

export function estimateDurationMin(template: HasEntries, exercisesById: ExerciseFactsById) {
  const totalSec = template.entries.reduce((sum, entry) => {
    const kind = exercisesById[entry.exerciseId]?.kind
    const timed = kind ? usesDuration(kind) : entry.durationSec !== undefined
    const workSec = timed ? (entry.durationSec ?? 0) : (entry.reps ?? 0) * SECONDS_PER_REP

    return sum + entry.sets * (workSec + entry.restSec) + SECONDS_PER_EXERCISE
  }, 0)

  return Math.round(totalSec / 60)
}

export function muscleGroupsOf(template: HasEntries, exercisesById: ExerciseFactsById) {
  const muscles = template.entries.flatMap(
    (entry) => exercisesById[entry.exerciseId]?.primaryMuscles ?? [],
  )

  return [...new Set(muscles)]
}
