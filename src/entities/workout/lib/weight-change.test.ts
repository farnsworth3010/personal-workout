import { describe, expect, it } from 'vitest'

import { weightChange, weightDelta } from './weight-change'

describe('weightChange', () => {
  it('says how the weight moved since the previous one', () => {
    expect(weightChange(80.2, 80.5)).toBe('−0,3 кг к прошлому разу')
    expect(weightChange(81, 80)).toBe('+1 кг к прошлому разу')
    expect(weightChange(80.04, 80)).toBe('как в прошлый раз')
  })

  it('is null without a previous weight', () => {
    expect(weightChange(80, null)).toBeNull()
  })

  it('rounds the delta to 0,1 kg', () => {
    expect(weightDelta(80.26, 80)).toBe(0.3)
    expect(weightDelta(79.94, 80)).toBe(-0.1)
  })
})
