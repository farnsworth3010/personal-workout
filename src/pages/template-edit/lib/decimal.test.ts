import { describe, expect, it } from 'vitest'

import { parseDecimal } from './decimal'

describe('parseDecimal', () => {
  it('reads a decimal comma and trims', () => {
    expect(parseDecimal(' 12,5 ')).toBe(12.5)
    expect(parseDecimal('abc')).toBeNaN()
  })
})
