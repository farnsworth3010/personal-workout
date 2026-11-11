import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import {
  exerciseRows,
  formatDuration,
  formatSet,
  previousBodyWeight,
  weightChange,
  workoutWhen,
} from './view'
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

describe('formatting', () => {
  it('formats duration, volume, sets and the time of day', () => {
    expect(formatDuration(3520)).toBe('58:40')
    expect(formatDuration(3912)).toBe('1:05:12')
    expect(formatSet({ n: 1, reps: 8, weightKg: 62.5, at: Timestamp.now() })).toBe('8 × 62,5 кг')
    expect(formatSet({ n: 1, reps: 8, at: Timestamp.now() })).toBe('8 повт.')
    expect(formatSet({ n: 1, durationSec: 45, at: Timestamp.now() })).toBe('45 с')
    expect(workoutWhen(finishedWorkout())).toBe('Среда, 11 ноября · 18:02–19:00')
  })
})

describe('body weight change', () => {
  it('compares with the latest earlier workout that recorded a weight', () => {
    const w = finishedWorkout()
    const earlier = (day: number, kg?: number) => ({
      ...w,
      startedAt: Timestamp.fromDate(new Date(2026, 10, day)),
      survey: kg === undefined ? {} : { bodyWeightKg: kg },
    })

    const history = [earlier(9), earlier(6, 82.4), earlier(2, 83), earlier(12, 80)]
    expect(previousBodyWeight(w, history)).toBe(82.4)
    expect(weightChange(82.1, 82.4)).toBe('−0,3 кг к прошлому разу')
    expect(weightChange(82.6, 82.4)).toBe('+0,2 кг к прошлому разу')
    expect(weightChange(82.4, 82.4)).toBe('как в прошлый раз')
    expect(weightChange(82.4, null)).toBeNull()
  })
})
