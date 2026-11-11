export {
  catalogQuery,
  findExercise,
  instructionsQuery,
  useCatalog,
  useCatalogById,
  useExercise,
} from './api/catalog'
export { muscleGroups, type MuscleGroup } from './config/groups'
export { equipmentLabels, equipmentList, kindLabels, muscleLabels } from './config/labels'
export { isGymOnly, photoUrl } from './lib/exercise'
export { filterCatalog, noFilter, type CatalogFilter } from './lib/filter'
export type { Equipment, ExerciseKind, Muscle } from '@/shared/api'
export type { Exercise } from './model/types'
