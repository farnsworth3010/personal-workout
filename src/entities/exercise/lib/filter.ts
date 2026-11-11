import type { Equipment, Muscle } from '@/shared/api'
import { fuzzyFilter } from '@/shared/lib'

import { equipmentLabels, muscleLabels } from '../config/labels'
import type { Exercise } from '../model/types'
import { isGymOnly } from './exercise'

export interface CatalogFilter {
  query: string
  /** A muscle group as a set of catalog muscles; matches the exercise's primary muscles. */
  muscles: readonly Muscle[] | null
  equipment: Equipment | null
  homeOnly: boolean
}

export const noFilter: CatalogFilter = {
  query: '',
  muscles: null,
  equipment: null,
  homeOnly: false,
}

// The English name and the Russian labels, so either language finds the exercise.
const searchFields = (exercise: Exercise) => [
  exercise.name,
  ...exercise.primaryMuscles.map((m) => muscleLabels[m]),
  ...exercise.secondaryMuscles.map((m) => muscleLabels[m]),
  exercise.equipment ? equipmentLabels[exercise.equipment] : '',
]

// Exercises without equipment in the dataset are stretches and drills, so they count as body weight.
const usesEquipment = (exercise: Exercise, equipment: Equipment) =>
  (exercise.equipment ?? 'body only') === equipment

/** The catalog narrowed by the chips and the switch, then fuzzy-searched with the best match first. */
export function filterCatalog(
  exercises: readonly Exercise[],
  filter: CatalogFilter,
  homeEquipment: readonly Equipment[],
) {
  const { muscles, equipment } = filter
  const narrowed = exercises.filter(
    (exercise) =>
      (!muscles || exercise.primaryMuscles.some((m) => muscles.includes(m))) &&
      (!equipment || usesEquipment(exercise, equipment)) &&
      (!filter.homeOnly || !isGymOnly(exercise, homeEquipment)),
  )

  return fuzzyFilter(narrowed, filter.query, searchFields)
}
