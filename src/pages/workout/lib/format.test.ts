import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { finishedWorkout } from '../model/workout.fixture'
import { formatSet, workoutWhen } from './format'

describe('formatting', () => {
  it('formats sets and the time of day', () => {
    expect(formatSet({ n: 1, reps: 8, weightKg: 62.5, at: Timestamp.now() })).toBe('8 × 62,5 кг')
    expect(formatSet({ n: 1, reps: 8, at: Timestamp.now() })).toBe('8 повт.')
    expect(formatSet({ n: 1, durationSec: 45, at: Timestamp.now() })).toBe('45 с')
    expect(workoutWhen(finishedWorkout())).toBe('Среда, 11 ноября · 18:02–19:00')
  })
})
