import { describe, expect, it } from 'vitest'

import { exerciseCounts, heaviestKg } from './summary'

const row = (id: string, exerciseId: string) => ({ id, exerciseId, sets: '', amount: '', rest: '' })

describe('exerciseCounts', () => {
  it('counts repeated exercises', () => {
    expect(exerciseCounts([row('1', 'Squat'), row('2', 'Run'), row('3', 'Squat')])).toEqual({
      Squat: 2,
      Run: 1,
    })
  })
})

describe('heaviestKg', () => {
  it('takes the heaviest set, 0 without weights', () => {
    expect(heaviestKg([{ weightKg: 60 }, {}, { weightKg: 62.5 }])).toBe(62.5)
    expect(heaviestKg([{}])).toBe(0)
  })
})
