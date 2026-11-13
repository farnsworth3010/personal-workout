import type { Equipment } from '@/entities/exercise'
import type { WithId, Workout } from '@/shared/api'

// Stable references, so memoised hooks do not recompute while data loads.
export const noEquipment: Equipment[] = []
export const noWorkouts: WithId<Workout>[] = []
