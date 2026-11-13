import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { exerciseRows, previousBodyWeight } from './view'
import { finishedWorkout } from './workout.fixture'

describe('exerciseRows', () => {
  it('keeps the order done and marks state, volume and the best set', () => {
    const rows = exerciseRows(finishedWorkout())

    expect(rows.map((r) => [r.exerciseId, r.state, r.volumeKg, r.best])).toEqual([
      // e1RM: 10 × 60 → 80, 8 × 62.5 → 79.17; the first 80 stays the best.
      ['Barbell_Bench_Press_-_Medium_Grip', 'done', 2075, 0],
      ['Seated_Cable_Rows', 'partial', 1200, 0],
      ['Barbell_Curl', 'skipped', 0, null],
      ['Pullups', 'done', 0, null],
      ['Plank', 'done', 0, null],
    ])
  })
})

describe('previousBodyWeight', () => {
  it('takes the latest earlier workout that recorded a weight', () => {
    const w = finishedWorkout()
    const earlier = (day: number, kg?: number) => ({
      ...w,
      startedAt: Timestamp.fromDate(new Date(2026, 10, day)),
      survey: kg === undefined ? {} : { bodyWeightKg: kg },
    })

    const history = [earlier(9), earlier(6, 82.4), earlier(2, 83), earlier(12, 80)]
    expect(previousBodyWeight(w, history)).toBe(82.4)
  })
})
