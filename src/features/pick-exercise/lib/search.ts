import { muscleLabels, type Exercise } from '@/entities/exercise'

const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()

// shortcut: duplicates the text search of pages/exercises/model/filter.ts, which a feature cannot import; lift both into entities/exercise when a third caller appears.
export function searchExercises(catalog: readonly Exercise[], query: string) {
  const q = normalize(query)
  if (!q) return catalog

  return catalog.filter((exercise) =>
    normalize(
      [
        exercise.name,
        ...[...exercise.primaryMuscles, ...exercise.secondaryMuscles].map((m) => muscleLabels[m]),
      ].join(' '),
    ).includes(q),
  )
}
