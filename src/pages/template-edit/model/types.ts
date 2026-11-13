import type { ExerciseKind, TemplateEntry } from '@/shared/api'

// Field values stay text while typed, so a cleared or half-typed input is not reset under the cursor.
export interface Row {
  // The entry's own id, also the row's key: the same exercise may appear in a set more than once.
  id: string
  exerciseId: string
  sets: string
  amount: string
  rest: string
  // An exercise that left the catalog: its kind is unknown, so the entry is kept untouched.
  stored?: TemplateEntry
}

export type Field = 'sets' | 'amount' | 'rest'

export type KindOf = (exerciseId: string) => ExerciseKind | undefined

export interface Problem {
  message: string
  focus: 'name' | 'add' | { row: number; field: Field }
}

export type Validation =
  { ok: true; name: string; entries: TemplateEntry[] } | ({ ok: false } & Problem)
