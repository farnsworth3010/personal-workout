import { limits, type ExerciseKind, type TemplateEntry } from '@/shared/api'

import { amountLabel } from '../config/amount-label'
import { parseDecimal } from '../lib/decimal'

import { toEntry } from './rows'
import type { Field, KindOf, Row, Validation } from './types'

const { templateName, templateEntries, sets, reps, durationSec, restSec } = limits

// Cardio is typed in minutes, so its range is the stored seconds' in whole minutes.
const amountLimits = (kind: ExerciseKind): [min: number, max: number] =>
  kind === 'cardio'
    ? [1, durationSec.max / 60]
    : kind === 'timed'
      ? [durationSec.min, durationSec.max]
      : [reps.min, reps.max]

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
  if (trimmed.length > templateName.max)
    return {
      ok: false,
      message: `Название — не длиннее ${templateName.max} символов`,
      focus: 'name',
    }
  if (rows.length === 0)
    return { ok: false, message: 'Добавьте хотя бы одно упражнение', focus: 'add' }
  if (rows.length > templateEntries.max)
    return {
      ok: false,
      message: `В наборе может быть не больше ${templateEntries.max} упражнений`,
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
    const amount = parseDecimal(row.amount)
    const amountOk =
      kind === 'cardio'
        ? amount >= minAmount && amount <= maxAmount
        : inRange(amount, minAmount, maxAmount)

    if (!inRange(parseDecimal(row.sets), sets.min, sets.max))
      return fail('sets', `подходов — целое число от ${sets.min} до ${sets.max}`)
    if (!amountOk) {
      const unit = amountLabel(kind).toLowerCase()
      const whole = kind === 'cardio' ? '' : 'целое число '

      return fail('amount', `${unit} — ${whole}от ${minAmount} до ${maxAmount}`)
    }
    if (!inRange(parseDecimal(row.rest), restSec.min, restSec.max))
      return fail('rest', `отдых — целое число секунд от ${restSec.min} до ${restSec.max}`)

    entries.push(toEntry(row, kind))
  }

  return { ok: true, name: trimmed, entries }
}
