import type { WorkoutEntry } from '@/shared/api'

export const decimal = (n: number, digits = 1) =>
  n.toLocaleString('ru', { maximumFractionDigits: digits })

// 540 → "540 кг", 15 620 → "15,6 т", as in finish.html.
export const mass = (kg: number) => (kg >= 1000 ? `${decimal(kg / 1000)} т` : `${decimal(kg)} кг`)

const plural = new Intl.PluralRules('ru')
const SETS = { one: 'подход', few: 'подхода', many: 'подходов', other: 'подхода' } as const

const range = (values: number[], unit: string) => {
  const low = Math.min(...values)
  const high = Math.max(...values)

  return low === high ? `${decimal(low)}${unit}` : `${decimal(low)}–${decimal(high)}${unit}`
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
    : `${n} ${SETS[plural.select(n) as keyof typeof SETS]}${kg}`
}
