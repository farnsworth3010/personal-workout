import { describe, expect, it } from 'vitest'

import { doneValues } from './plan'

describe('doneValues', () => {
  it('logs the time held when a timed set ends early', () => {
    expect(doneValues('timed', { durationSec: 30 }, 0, 10_400)).toEqual({ durationSec: 10 })
  })

  it('caps a timed set held past its plan at the plan', () => {
    expect(doneValues('timed', { durationSec: 30 }, 0, 45_000)).toEqual({ durationSec: 30 })
  })

  it('keeps the prediction of other kinds and of a set without a start', () => {
    expect(doneValues('strength', { reps: 10, weightKg: 60 }, 0, 5000)).toEqual({
      reps: 10,
      weightKg: 60,
    })
    expect(doneValues('cardio', { durationSec: 600 }, 0, 5000)).toEqual({ durationSec: 600 })
    expect(doneValues('timed', { durationSec: 30 }, null, 5000)).toEqual({ durationSec: 30 })
  })
})
