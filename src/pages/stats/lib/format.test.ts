import { describe, expect, it } from 'vitest'

import { formatTotal, weekdayNames } from './format'

describe('formatTotal', () => {
  it('shows minutes below an hour and whole hours from one hour up', () => {
    expect(formatTotal(3540)).toEqual({ value: 59, unit: 'мин' })
    expect(formatTotal(3600)).toEqual({ value: 1, unit: 'ч' })
    expect(formatTotal(5400)).toEqual({ value: 2, unit: 'ч' })
  })
})

describe('weekdayNames', () => {
  it('names the week from Monday in short Russian', () => {
    expect(weekdayNames).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'])
  })
})
