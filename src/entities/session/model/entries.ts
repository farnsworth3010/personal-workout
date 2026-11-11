import type { ExerciseKind, TemplateEntry } from '@/shared/api'

import type { NewEntry } from './store'

interface ExerciseFacts {
  name: string
  kind: ExerciseKind
}

// Entries whose exercise is missing from the catalog are left out.
export function toSessionEntries(
  entries: readonly TemplateEntry[],
  exercisesById: Readonly<Record<string, ExerciseFacts | undefined>>,
): NewEntry[] {
  return entries.flatMap(({ exerciseId, ...plan }) => {
    const exercise = exercisesById[exerciseId]

    return exercise ? [{ exerciseId, name: exercise.name, kind: exercise.kind, plan }] : []
  })
}
