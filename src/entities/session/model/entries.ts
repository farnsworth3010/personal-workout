import type { ExerciseKind, TemplateEntry } from '@/shared/api'

import type { NewEntry } from './store'

interface ExerciseFacts {
  name: string
  kind: ExerciseKind
}

// Entries whose exercise is missing from the catalog are left out; each keeps its template entry id.
export function toSessionEntries(
  entries: readonly TemplateEntry[],
  exercisesById: Readonly<Record<string, ExerciseFacts | undefined>>,
): NewEntry[] {
  return entries.flatMap(({ id, exerciseId, ...plan }) => {
    const exercise = exercisesById[exerciseId]

    return exercise ? [{ id, exerciseId, name: exercise.name, kind: exercise.kind, plan }] : []
  })
}
