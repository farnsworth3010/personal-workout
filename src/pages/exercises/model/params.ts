import {
  equipmentLabels,
  muscleGroups,
  type CatalogChoice,
  type Equipment,
  type MuscleGroup,
} from '@/entities/exercise'

export interface CatalogParams extends CatalogChoice {
  q: string
}

const isMuscleGroup = (value: string | null): value is MuscleGroup =>
  value !== null && Object.hasOwn(muscleGroups, value)

const isEquipment = (value: string | null): value is Equipment =>
  value !== null && Object.hasOwn(equipmentLabels, value)

// Unknown values from a hand-edited or stale URL are dropped instead of filtering everything out.
export function readParams(params: URLSearchParams): CatalogParams {
  const group = params.get('muscle')
  const equipment = params.get('equipment')

  return {
    q: params.get('q') ?? '',
    group: isMuscleGroup(group) ? group : null,
    equipment: isEquipment(equipment) ? equipment : null,
    homeOnly: params.has('home'),
  }
}

export function writeParams({ q, group, equipment, homeOnly }: CatalogParams): URLSearchParams {
  const params = new URLSearchParams()

  if (q) params.set('q', q)
  if (group) params.set('muscle', group)
  if (equipment) params.set('equipment', equipment)
  if (homeOnly) params.set('home', '')

  return params
}
