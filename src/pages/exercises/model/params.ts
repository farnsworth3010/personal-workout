import {
  equipmentLabels,
  muscleGroups,
  type Equipment,
  type MuscleGroup,
} from '@/entities/exercise'

export interface CatalogParams {
  q: string
  muscle: MuscleGroup | null
  equipment: Equipment | null
  home: boolean
}

const isMuscleGroup = (value: string | null): value is MuscleGroup =>
  value !== null && Object.hasOwn(muscleGroups, value)

const isEquipment = (value: string | null): value is Equipment =>
  value !== null && Object.hasOwn(equipmentLabels, value)

// Unknown values from a hand-edited or stale URL are dropped instead of filtering everything out.
export function readParams(params: URLSearchParams): CatalogParams {
  const muscle = params.get('muscle')
  const equipment = params.get('equipment')

  return {
    q: params.get('q') ?? '',
    muscle: isMuscleGroup(muscle) ? muscle : null,
    equipment: isEquipment(equipment) ? equipment : null,
    home: params.has('home'),
  }
}

export function writeParams({ q, muscle, equipment, home }: CatalogParams): URLSearchParams {
  const params = new URLSearchParams()

  if (q) params.set('q', q)
  if (muscle) params.set('muscle', muscle)
  if (equipment) params.set('equipment', equipment)
  if (home) params.set('home', '')

  return params
}
