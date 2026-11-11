import { describe, expect, it } from 'vitest'

import { predictSet, roundKg } from './prediction'

const plan = { sets: 4, reps: 10, restSec: 90 }

const history = [
  { reps: 10, weightKg: 60 },
  { reps: 8, weightKg: 62.5 },
]

describe('predictSet', () => {
  it('takes the same set number from history and shows it as last time', () => {
    expect(predictSet(2, plan, history)).toEqual({
      values: { reps: 8, weightKg: 62.5 },
      last: { reps: 8, weightKg: 62.5 },
    })
  })

  it('falls back to the last known set past the end of history, with nothing to show as last time', () => {
    expect(predictSet(4, plan, history)).toEqual({
      values: { reps: 8, weightKg: 62.5 },
      last: undefined,
    })
  })

  it('falls back to the plan with no weight without history', () => {
    expect(predictSet(1, plan)).toEqual({ values: { reps: 10 }, last: undefined })
  })

  it('takes the planned duration for a timed exercise without history', () => {
    expect(predictSet(1, { sets: 3, durationSec: 45, restSec: 60 }, []).values).toEqual({
      durationSec: 45,
    })
  })

  it('adds today’s weight shift to the history weight', () => {
    expect(predictSet(1, plan, history, 2.5).values).toEqual({ reps: 10, weightKg: 62.5 })
  })

  it('applies the shift to a prediction without weight, starting from zero', () => {
    expect(predictSet(1, plan, [], 20).values).toEqual({ reps: 10, weightKg: 20 })
  })

  it('never predicts a negative weight', () => {
    expect(predictSet(1, plan, history, -100).values.weightKg).toBe(0)
  })

  it('leaves the shown last time unshifted', () => {
    expect(predictSet(1, plan, history, 5).last).toEqual({ reps: 10, weightKg: 60 })
  })

  it('rounds float noise out of the shifted weight', () => {
    expect(predictSet(1, plan, [{ reps: 5, weightKg: 0.1 }], 0.2).values.weightKg).toBe(0.3)
    expect(roundKg(62.499999)).toBe(62.5)
  })
})
