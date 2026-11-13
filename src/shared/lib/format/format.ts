const n1Format = new Intl.NumberFormat('ru', { maximumFractionDigits: 1 })

/** Up to one decimal, Russian separators: 62,5; 1 250. */
export const n1 = (value: number) => n1Format.format(value)

/** The one rounding rule for mass totals: whole kilograms, or tonnes with one decimal from 1000 kg. */
export function formatMass(kg: number): { value: string; unit: 'кг' | 'т' } {
  const whole = Math.round(kg)

  return whole >= 1000 ? { value: n1(kg / 1000), unit: 'т' } : { value: n1(whole), unit: 'кг' }
}

/** "62,5 кг", "15,6 т": formatMass as one string. */
export function formatMassText(kg: number) {
  const { value, unit } = formatMass(kg)

  return `${value} ${unit}`
}

/** Decimal comma, no rounding or grouping, for editable values: 61.25 → "61,25". */
export const decimalComma = (value: number) => String(value).replace('.', ',')

/** 90 → "1:30", with pad 2 → "01:30"; hours stay in the minutes: 3725 → "62:05". */
export const formatDuration = (sec: number, pad = 1) =>
  `${String(Math.floor(sec / 60)).padStart(pad, '0')}:${String(sec % 60).padStart(2, '0')}`

/** Russian plural forms [one, few, many]; fractions take the "few" form (0,5 подхода). */
export function plural(n: number, [one, few, many]: readonly [string, string, string]) {
  if (!Number.isInteger(n)) return few

  const tens = n % 100
  const units = n % 10
  if (tens > 10 && tens < 20) return many
  return units === 1 ? one : units > 1 && units < 5 ? few : many
}

export const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('ru') + text.slice(1)

/** "Среда, 11 ноября" */
export const longDate = (date: Date) =>
  capitalize(date.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }))

/** "18:02" */
export const clockTime = (date: Date) =>
  date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
