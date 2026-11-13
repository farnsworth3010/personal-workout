import { describe, expect, it } from 'vitest'

import {
  capitalize,
  clockTime,
  decimalComma,
  formatDuration,
  formatMass,
  formatMassText,
  longDate,
  n1,
  plural,
} from './format'

const nbsp = (s: string) => s.replace(/\s/g, ' ')

const SETS = ['подход', 'подхода', 'подходов'] as const

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

  it('joins mass and unit into one text', () => {
    expect(formatMassText(612.5)).toBe('613 кг')
    expect(formatMassText(15_620)).toBe('15,6 т')
  })

  it('writes a decimal comma without rounding or grouping', () => {
    expect(decimalComma(61.25)).toBe('61,25')
    expect(decimalComma(1250)).toBe('1250')
  })

  it('formats a duration as minutes and seconds, minutes past an hour included', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(90, 2)).toBe('01:30')
    expect(formatDuration(3725)).toBe('62:05')
  })

  it('picks the Russian plural form, the few form for fractions', () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111, 0].map((n) => plural(n, SETS))).toEqual([
      'подход',
      'подхода',
      'подходов',
      'подходов',
      'подходов',
      'подход',
      'подхода',
      'подходов',
      'подходов',
      'подходов',
    ])
    expect(plural(0.5, SETS)).toBe('подхода')
    expect(plural(1.5, SETS)).toBe('подхода')
  })

  it('capitalises the first letter only', () => {
    expect(capitalize('среда, 11 ноября')).toBe('Среда, 11 ноября')
    expect(capitalize('')).toBe('')
  })

  it('formats a long date and a clock time', () => {
    const date = new Date(2026, 10, 11, 18, 2)

    expect(longDate(date)).toBe('Среда, 11 ноября')
    expect(clockTime(date)).toBe('18:02')
  })
})
