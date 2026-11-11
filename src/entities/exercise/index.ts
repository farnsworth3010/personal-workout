export {
  catalogQuery,
  findExercise,
  instructionsQuery,
  useCatalog,
  useCatalogById,
  useExercise,
} from './api/catalog'
export { equipmentLabels, equipmentList, kindLabels, muscleLabels } from './config/labels'
export { isGymOnly, photoUrl } from './lib/exercise'
export type { Equipment, ExerciseKind, Muscle } from '@/shared/api'
export type { Exercise } from './model/types'
