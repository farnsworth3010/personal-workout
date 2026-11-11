import { describe, expect, it } from 'vitest'

import { formatMass, n1 } from './format'

const nbsp = (s: string) => s.replace(/\s/g, ' ')

describe('format', () => {
  it('keeps at most one decimal with Russian separators', () => {
    expect(n1(62.5)).toBe('62,5')
    expect(n1(62.54)).toBe('62,5')
    expect(n1(60)).toBe('60')
    expect(nbsp(n1(1250))).toBe('1 250')
  })

  it('rounds mass to whole kilograms below a tonne and to 0,1 t above', () => {
    expect(formatMass(612.5)).toEqual({ value: '613', unit: 'кг' })
    expect(formatMass(999.6)).toEqual({ value: '1', unit: 'т' })
    expect(formatMass(15_620)).toEqual({ value: '15,6', unit: 'т' })
    expect(formatMass(0)).toEqual({ value: '0', unit: 'кг' })
  })
})
