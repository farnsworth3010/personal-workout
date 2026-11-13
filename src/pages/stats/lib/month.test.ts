import { describe, expect, it } from 'vitest'

import { monthStart } from './month'

describe('monthStart', () => {
  it('starts the month on its first day', () => {
    expect(monthStart(new Date(2026, 10, 11, 12))).toEqual(new Date(2026, 10, 1))
  })
})
