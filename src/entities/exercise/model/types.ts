import type { Equipment, ExerciseKind, Muscle } from '@/shared/api'

import type { MuscleGroup } from '../config/groups'

export interface Exercise {
  id: string
  name: string
  kind: ExerciseKind
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  equipment: Equipment | null
  /** Empty in the catalog list; useExercise fills it from catalog/instructions.json. */
  instructions: string[]
  /** Paths relative to /catalog/images/, e.g. `Plank/0.jpg`. */
  images: string[]
}

/** The catalog keyed by id, as useCatalogById returns it. */
export type ExercisesById = Record<string, Exercise | undefined>

/** The chips and the switch of the catalog filters; null means "all". */
export interface CatalogChoice {
  group: MuscleGroup | null
  equipment: Equipment | null
  homeOnly: boolean
}
