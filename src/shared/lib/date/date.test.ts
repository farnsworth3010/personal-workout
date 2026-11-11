import { describe, expect, it } from 'vitest'

import { addDays, sameDay, startOfDay, weekStart } from './date'

describe('date', () => {
  it('steps by calendar day across month ends', () => {
    expect(addDays(new Date(2026, 9, 31, 18), 1)).toEqual(new Date(2026, 10, 1))
    expect(addDays(new Date(2026, 10, 1), -1)).toEqual(new Date(2026, 9, 31))
  })

  it('compares days, not instants', () => {
    expect(sameDay(new Date(2026, 10, 11, 0, 5), new Date(2026, 10, 11, 23, 55))).toBe(true)
    expect(sameDay(new Date(2026, 10, 11, 23, 55), new Date(2026, 10, 12, 0, 5))).toBe(false)
    expect(startOfDay(new Date(2026, 10, 11, 13, 30))).toEqual(new Date(2026, 10, 11))
  })

  it('starts the week on Monday', () => {
    // 2026-11-11 is a Wednesday, 2026-11-15 a Sunday.
    expect(weekStart(new Date(2026, 10, 11, 9))).toEqual(new Date(2026, 10, 9))
    expect(weekStart(new Date(2026, 10, 15, 23))).toEqual(new Date(2026, 10, 9))
    expect(weekStart(new Date(2026, 10, 9))).toEqual(new Date(2026, 10, 9))
  })
})
