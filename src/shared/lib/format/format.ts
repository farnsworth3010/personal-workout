const n1Format = new Intl.NumberFormat('ru', { maximumFractionDigits: 1 })

/** Up to one decimal, Russian separators: 62,5; 1 250. */
export const n1 = (value: number) => n1Format.format(value)

/** The one rounding rule for mass totals: whole kilograms, or tonnes with one decimal from 1000 kg. */
export function formatMass(kg: number): { value: string; unit: 'кг' | 'т' } {
  const whole = Math.round(kg)

  return whole >= 1000 ? { value: n1(kg / 1000), unit: 'т' } : { value: n1(whole), unit: 'кг' }
}
