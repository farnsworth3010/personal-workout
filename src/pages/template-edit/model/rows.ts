import type { ExercisesById } from '@/entities/exercise'
import type { ExerciseKind, TemplateEntry } from '@/shared/api'
import { decimalComma, newId } from '@/shared/lib'

import { parseDecimal } from '../lib/decimal'

import type { KindOf, Row } from './types'

const kindDefaults: Record<ExerciseKind, [sets: number, amount: number, rest: number]> = {
  strength: [3, 10, 90],
  bodyweight: [3, 12, 60],
  timed: [3, 30, 30],
  cardio: [1, 10, 60],
}

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
    sets: decimalComma(entry.sets),
    amount: decimalComma(amount),
    rest: decimalComma(entry.restSec),
  }
}

export function newRow(exerciseId: string, kind: ExerciseKind, defaultRestSec?: number): Row {
  const [sets, amount, rest] = kindDefaults[kind]

  return {
    id: newId(),
    exerciseId,
    sets: decimalComma(sets),
    amount: decimalComma(amount),
    rest: decimalComma(kind === 'strength' ? (defaultRestSec ?? rest) : rest),
  }
}

export function toEntry(row: Row, kind: ExerciseKind, num = parseDecimal): TemplateEntry {
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

// Best-effort entries for the summary while fields are mid-edit: unreadable numbers count as 0.
export function previewEntries(rows: readonly Row[], kindOf: KindOf): TemplateEntry[] {
  const num = (value: string) => parseDecimal(value) || 0

  return rows.flatMap((row) => {
    const kind = kindOf(row.exerciseId)

    return kind ? [toEntry(row, kind, num)] : []
  })
}

/** The rows to start from, with ?add=<exerciseId> appended (a set may hold an exercise twice). */
export function initialRows(
  entries: readonly TemplateEntry[],
  addId: string | null,
  byId: ExercisesById,
  defaultRestSec: number,
): Row[] {
  const rows = entries.map((e) => rowOf(e, byId[e.exerciseId]?.kind))
  const exercise = addId ? byId[addId] : undefined

  return exercise ? [...rows, newRow(exercise.id, exercise.kind, defaultRestSec)] : rows
}
