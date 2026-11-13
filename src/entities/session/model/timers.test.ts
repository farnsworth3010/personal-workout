import { describe, expect, it } from 'vitest'

import { elapsed, restRemaining, timedRemaining } from './timers'

const t0 = 1_700_000_000_000
const sec = (s: number) => t0 + s * 1000

describe('elapsed', () => {
  it('counts whole seconds since the start', () => {
    expect(elapsed(t0, sec(0))).toBe(0)
    expect(elapsed(t0, sec(59.9))).toBe(59)
    expect(elapsed(t0, sec(61))).toBe(61)
  })

  it('includes a gap while the device slept or the app was closed', () => {
    expect(elapsed(t0, sec(2 * 3600 + 5))).toBe(7205)
  })

  it('never goes negative when the clock is behind the stored start', () => {
    expect(elapsed(t0, sec(-30))).toBe(0)
  })
})

describe('restRemaining', () => {
  const endsAt = sec(90)

  it('is null without a running rest', () => {
    expect(restRemaining(null, sec(10))).toBeNull()
  })

  it('counts down and shows a started second', () => {
    expect(restRemaining(endsAt, sec(0))).toBe(90)
    expect(restRemaining(endsAt, sec(0.5))).toBe(90)
    expect(restRemaining(endsAt, sec(89.1))).toBe(1)
    expect(restRemaining(endsAt, sec(90))).toBe(0)
  })

  it('reads the real remainder after a reload from the stored end time', () => {
    const restored = JSON.parse(JSON.stringify({ endsAt })) as { endsAt: number }

    expect(restRemaining(restored.endsAt, sec(40))).toBe(50)
  })

  it('stays at zero after sleeping through the end', () => {
    expect(restRemaining(endsAt, sec(600))).toBe(0)
  })
})

describe('timedRemaining', () => {
  it('counts down the planned duration from the set start', () => {
    expect(timedRemaining(t0, 45, sec(0))).toBe(45)
    expect(timedRemaining(t0, 45, sec(30))).toBe(15)
  })

  it('ends at zero after a gap longer than the set', () => {
    expect(timedRemaining(t0, 45, sec(300))).toBe(0)
  })
})
