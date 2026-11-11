import type { Equipment, ExerciseKind, Muscle } from '@/shared/api'

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
