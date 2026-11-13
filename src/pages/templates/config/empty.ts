import type { Equipment } from '@/entities/exercise'

// A stable reference, so useTemplateList does not recompute while the profile loads.
export const noEquipment: Equipment[] = []
