import type { Exercise } from '@/entities/exercise'
import type { ExerciseKind, TemplateEntry } from '@/shared/api'
import { newId } from '@/shared/lib'

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

export const MAX_NAME = 60
export const MAX_ENTRIES = 40

const DEFAULTS: Record<ExerciseKind, [sets: number, amount: number, rest: number]> = {
  strength: [3, 10, 90],
  bodyweight: [3, 12, 60],
  timed: [3, 30, 30],
  cardio: [1, 10, 60],
}

// Cardio is planned in minutes, timed exercises in seconds; both are stored as durationSec.
export const amountLabel = (kind: ExerciseKind) =>
  ({ strength: 'Повторы', bodyweight: 'Повторы', timed: 'Секунды', cardio: 'Минуты' })[kind]

const amountLimits = (kind: ExerciseKind): [min: number, max: number] =>
  ({ strength: [1, 200], bodyweight: [1, 200], timed: [5, 7200], cardio: [1, 120] })[kind] as [
    number,
    number,
  ]

const text = (n: number) => String(n).replace('.', ',')
const parse = (value: string) => Number(value.trim().replace(',', '.'))

export function rowOf(entry: TemplateEntry, kind: ExerciseKind | undefined): Row {
  if (!kind) {
    return {
      id: entry.id,
      exerciseId: entry.exerciseId,
      sets: '',
      amount: '',
      rest: '',
      stored: entry,
    }
  }

  const amount =
    entry.durationSec === undefined
      ? (entry.reps ?? 0)
      : kind === 'cardio'
        ? Math.round((entry.durationSec / 60) * 10) / 10
        : entry.durationSec

  return {
    id: entry.id,
    exerciseId: entry.exerciseId,
    sets: text(entry.sets),
    amount: text(amount),
    rest: text(entry.restSec),
  }
}

export function newRow(exerciseId: string, kind: ExerciseKind, defaultRestSec?: number): Row {
  const [sets, amount, rest] = DEFAULTS[kind]

  return {
    id: newId(),
    exerciseId,
    sets: text(sets),
    amount: text(amount),
    rest: text(kind === 'strength' ? (defaultRestSec ?? rest) : rest),
  }
}

function toEntry(row: Row, kind: ExerciseKind, num = parse): TemplateEntry {
  const base = {
    id: row.id,
    exerciseId: row.exerciseId,
    sets: num(row.sets),
    restSec: num(row.rest),
  }
  const amount = num(row.amount)

  if (kind === 'cardio') return { ...base, durationSec: Math.round(amount * 60) }
  if (kind === 'timed') return { ...base, durationSec: amount }

  return { ...base, reps: amount }
}

// Moves the row by delta places; out-of-range moves return the same array.
export function move<T>(rows: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= rows.length) return rows

  const next = [...rows]
  ;[next[index], next[target]] = [next[target], next[index]]

  return next
}

// Best-effort entries for the summary while fields are mid-edit: unreadable numbers count as 0.
export function previewEntries(rows: readonly Row[], kindOf: KindOf): TemplateEntry[] {
  const num = (value: string) => parse(value) || 0

  return rows.flatMap((row) => {
    const kind = kindOf(row.exerciseId)

    return kind ? [toEntry(row, kind, num)] : []
  })
}

export interface Problem {
  message: string
  focus: 'name' | 'add' | { row: number; field: Field }
}

export type Validation =
  { ok: true; name: string; entries: TemplateEntry[] } | ({ ok: false } & Problem)

const inRange = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max

// The limits of templateSchema, reported one at a time in reading order with a field to focus.
export function validate(
  name: string,
  rows: readonly Row[],
  kindOf: KindOf,
  nameOf: (exerciseId: string) => string,
): Validation {
  const trimmed = name.trim()

  if (!trimmed) return { ok: false, message: 'Дайте набору название', focus: 'name' }
  if (trimmed.length > MAX_NAME)
    return { ok: false, message: `Название — не длиннее ${MAX_NAME} символов`, focus: 'name' }
  if (rows.length === 0)
    return { ok: false, message: 'Добавьте хотя бы одно упражнение', focus: 'add' }
  if (rows.length > MAX_ENTRIES)
    return {
      ok: false,
      message: `В наборе может быть не больше ${MAX_ENTRIES} упражнений`,
      focus: 'add',
    }

  const entries: TemplateEntry[] = []

  for (const [index, row] of rows.entries()) {
    if (row.stored) {
      entries.push(row.stored)
      continue
    }

    const kind = kindOf(row.exerciseId) ?? 'strength'
    const exercise = `«${nameOf(row.exerciseId)}»`
    const fail = (field: Field, rule: string): Validation => ({
      ok: false,
      message: `${exercise}: ${rule}`,
      focus: { row: index, field },
    })

    const [minAmount, maxAmount] = amountLimits(kind)
    const amount = parse(row.amount)
    const amountOk =
      kind === 'cardio'
        ? amount >= minAmount && amount <= maxAmount
        : inRange(amount, minAmount, maxAmount)

    if (!inRange(parse(row.sets), 1, 20)) return fail('sets', 'подходов — целое число от 1 до 20')
    if (!amountOk) {
      const unit = amountLabel(kind).toLowerCase()
      const whole = kind === 'cardio' ? '' : 'целое число '

      return fail('amount', `${unit} — ${whole}от ${minAmount} до ${maxAmount}`)
    }
    if (!inRange(parse(row.rest), 0, 900))
      return fail('rest', 'отдых — целое число секунд от 0 до 900')

    entries.push(toEntry(row, kind))
  }

  return { ok: true, name: trimmed, entries }
}

/** The rows to start from, with ?add=<exerciseId> appended (a set may hold an exercise twice). */
export function initialRows(
  entries: readonly TemplateEntry[],
  addId: string | null,
  byId: Readonly<Record<string, Exercise | undefined>>,
  defaultRestSec: number,
): { rows: Row[]; added: Exercise | undefined } {
  const rows = entries.map((e) => rowOf(e, byId[e.exerciseId]?.kind))
  const exercise = addId ? byId[addId] : undefined

  if (!exercise) return { rows, added: undefined }

  return { rows: [...rows, newRow(exercise.id, exercise.kind, defaultRestSec)], added: exercise }
}
