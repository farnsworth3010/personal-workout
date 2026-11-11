import { isGymOnly, type Equipment, type Exercise, type Muscle } from '@/entities/exercise'

export interface CatalogFilter {
  query: string
  /** A muscle group as a set of catalog muscles; matches the exercise's primary muscles. */
  muscles: readonly Muscle[] | null
  equipment: Equipment | null
  homeOnly: boolean
}

export interface CatalogLabels {
  muscles: Record<Muscle, string>
  equipment: Record<Equipment, string>
}

export const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()

const searchText = (exercise: Exercise, labels: CatalogLabels) =>
  normalize(
    [
      exercise.name,
      ...exercise.primaryMuscles.map((m) => labels.muscles[m]),
      ...exercise.secondaryMuscles.map((m) => labels.muscles[m]),
      exercise.equipment ? labels.equipment[exercise.equipment] : '',
    ].join(' '),
  )

// Exercises without equipment in the dataset are stretches and drills, so they count as body weight.
const usesEquipment = (exercise: Exercise, equipment: Equipment) =>
  (exercise.equipment ?? 'body only') === equipment

export function filterCatalog(
  exercises: readonly Exercise[],
  filter: CatalogFilter,
  homeEquipment: readonly Equipment[],
  labels: CatalogLabels,
) {
  const query = normalize(filter.query)
  const { muscles, equipment } = filter

  return exercises.filter(
    (exercise) =>
      (!query || searchText(exercise, labels).includes(query)) &&
      (!muscles || exercise.primaryMuscles.some((m) => muscles.includes(m))) &&
      (!equipment || usesEquipment(exercise, equipment)) &&
      (!filter.homeOnly || !isGymOnly(exercise, homeEquipment)),
  )
}
