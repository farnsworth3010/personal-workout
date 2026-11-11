export {
  catalogQuery,
  findExercise,
  instructionsQuery,
  useCatalog,
  useExercise,
} from './api/catalog'
export { equipmentLabels, kindLabels, muscleLabels } from './config/labels'
export { isGymOnly, photoUrl } from './lib/exercise'
export type { Equipment, ExerciseKind, Muscle } from '@/shared/api'
export type { Exercise } from './model/types'
