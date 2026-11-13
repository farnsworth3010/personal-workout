import type { RecordKey, Records } from '@/entities/workout'
import type { WorkoutEntry } from '@/shared/api'
import { n1, plural } from '@/shared/lib'

const range = (values: number[], unit: string) => {
  const low = Math.min(...values)
  const high = Math.max(...values)

  return low === high ? `${n1(low)}${unit}` : `${n1(low)}–${n1(high)}${unit}`
}

// "4 × 12 · 140 кг" when every set matches, "4 подхода · 60–62,5 кг" otherwise; null for no sets.
export function setsLine({ sets }: Pick<WorkoutEntry, 'sets'>): string | null {
  if (sets.length === 0) return null

  const n = sets.length
  const weights = sets.flatMap((s) => (s.weightKg ? [s.weightKg] : []))
  const kg = weights.length ? ` · ${range(weights, ' кг')}` : ''
  const durations = sets.flatMap((s) => (s.durationSec === undefined ? [] : [s.durationSec]))

  if (durations.length) return `${n} × ${range(durations, ' с')}${kg}`

  const reps = sets.map((s) => s.reps ?? 0)
  const same = reps.every((r) => r === reps[0]) && new Set(weights).size <= 1

  return same
    ? `${n} × ${reps[0]}${kg}`
    : `${n} ${plural(n, ['подход', 'подхода', 'подходов'])}${kg}`
}

// "9 ноября"
export const sinceDate = (date: Date) =>
  date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

export const recordValue = (key: RecordKey, records: Records | undefined) => {
  if (key === 'bestSet') {
    const set = records?.bestSet
    return set && `${set.reps} × ${n1(set.weightKg)} кг`
  }

  const kg = records?.[key]
  return kg === undefined ? undefined : `${n1(kg)} кг`
}
