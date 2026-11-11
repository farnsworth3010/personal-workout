import type { Exercise } from '../../src/entities/exercise/model/types.ts'
import type { Equipment, ExerciseKind, Muscle } from '../../src/shared/api/schema/documents.ts'

/** One record of the dataset's dist/exercises.json, fields the build reads. */
export interface RawExercise {
  id: string
  name: string
  category: string
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  images: string[]
}

export interface Override {
  kind?: ExerciseKind
  equipment?: Equipment | null
  reason: string
}

/** Research R11; `pull-up bar` is an override of `body only`, so it counts as body weight too. */
export function deriveKind(category: string, equipment: string | null): ExerciseKind {
  if (category === 'stretching') return 'timed'

  if (category === 'cardio') return 'cardio'

  if (equipment === 'body only' || equipment === 'pull-up bar') return 'bodyweight'

  return 'strength'
}

// Muscle and equipment values are checked against the label lists by scripts/catalog.test.ts.
export function toExercise(raw: RawExercise, override?: Override): Exercise {
  const equipment =
    override && 'equipment' in override ? override.equipment : (raw.equipment as Equipment | null)

  return {
    id: raw.id,
    name: raw.name,
    kind: override?.kind ?? deriveKind(raw.category, equipment ?? null),
    primaryMuscles: raw.primaryMuscles as Muscle[],
    secondaryMuscles: raw.secondaryMuscles as Muscle[],
    equipment: equipment ?? null,
    instructions: raw.instructions,
    images: raw.images.map((_, n) => `${raw.id}/${n}.jpg`),
  }
}

/** An exercise of scripts/local/exercises.json: written here, not taken from the dataset. */
export interface LocalExercise {
  id: string
  name: string
  instructions: string[]
}

export const LOCAL_EYE_IMAGE = 'local/eye.svg'

// The local exercises are all eye exercises: timed, no equipment, the neutral eye icon as photo.
export function toLocalExercise(local: LocalExercise): Exercise {
  return {
    id: local.id,
    name: local.name,
    kind: 'timed',
    primaryMuscles: ['eyes'],
    secondaryMuscles: [],
    equipment: null,
    instructions: local.instructions,
    images: [LOCAL_EYE_IMAGE],
  }
}
