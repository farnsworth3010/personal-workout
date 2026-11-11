import { describe, expect, it } from 'vitest'

import { toSessionEntries } from './entries'

describe('toSessionEntries', () => {
  it('copies the plan and the exercise name and kind, skipping unknown exercises', () => {
    const entries = [
      { exerciseId: 'Plank', sets: 3, durationSec: 45, restSec: 60 },
      { exerciseId: 'Gone', sets: 3, reps: 10, restSec: 90 },
    ]

    expect(toSessionEntries(entries, { Plank: { name: 'Plank', kind: 'timed' } })).toEqual([
      {
        exerciseId: 'Plank',
        name: 'Plank',
        kind: 'timed',
        plan: { sets: 3, durationSec: 45, restSec: 60 },
      },
    ])
  })
})
