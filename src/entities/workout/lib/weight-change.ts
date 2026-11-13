import { n1 } from '@/shared/lib'

/** kg − previous, rounded to 0,1 kg as the scale shows it. */
export const weightDelta = (kg: number, previous: number) => Math.round((kg - previous) * 10) / 10

/** "−0,3 кг к прошлому разу", "как в прошлый раз" or null without a previous weight. */
export function weightChange(kg: number, previous: number | null) {
  if (previous === null) return null

  const d = weightDelta(kg, previous)
  if (d === 0) return 'как в прошлый раз'
  return `${d > 0 ? '+' : '−'}${n1(Math.abs(d))} кг к прошлому разу`
}
