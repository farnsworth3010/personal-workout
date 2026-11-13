import type { Equipment } from '@/entities/exercise'

// Rows rendered per step: the whole catalog at once makes typing lag on slow phones.
export const PAGE_SIZE = 60
export const DESKTOP = '(min-width: 900px)'

export const noEquipment: Equipment[] = []
