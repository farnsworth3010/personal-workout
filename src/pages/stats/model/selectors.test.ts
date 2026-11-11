import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import type { LoggedSet, Workout, WorkoutEntry } from '@/shared/api'
import { addDays, weekStart } from '@/shared/lib'

import { bodyWeightSeries, weeklySurvey } from './body'
import { firstMonth, monthCalendar, totalDurationSec, workoutsThisWeek } from './calendar'
import { weekMuscleLoad } from './muscle-load'
import { exerciseProgress, exercisesWithHistory } from './progress'

// Local dates; "now" is Wednesday 11 November 2026, noon.
const day = (d: number, m = 10, h = 18) => new Date(2026, m, d, h)
const now = day(11, 10, 12)

const sets = (...pairs: [reps: number, weightKg?: number][]): LoggedSet[] =>
  pairs.map(([reps, weightKg], i) => ({
    n: i + 1,
    reps,
    ...(weightKg === undefined ? {} : { weightKg }),
    at: Timestamp.fromDate(now),
  }))

const entry = (exerciseId: string, kind: WorkoutEntry['kind'], logged: LoggedSet[]) => ({
  id: exerciseId,
  exerciseId,
  name: exerciseId,
  kind,
  status: 'done' as const,
  plan: { sets: 3, reps: 10, restSec: 90 },
  sets: logged,
})

const workout = (
  date: Date,
  durationSec: number,
  muscleSets: NonNullable<Workout['summary']>['muscleSets'],
  entries: WorkoutEntry[] = [],
  survey: Workout['survey'] = {},
): Workout => ({
  status: 'done',
  startedAt: Timestamp.fromDate(date),
  endedAt: Timestamp.fromDate(date),
  template: { source: 'own', id: 't1', name: 'Push' },
  entries,
  survey,
  summary: { durationSec, volumeKg: 0, setsDone: 0, muscleSets },
  updatedAt: Timestamp.fromDate(date),
})

const bench = (...pairs: [number, number][]) => entry('Bench', 'strength', sets(...pairs))

// Unsorted on purpose: selectors must not rely on query order.
const workouts = [
  workout(
    day(9, 10, 7),
    3600,
    { chest: 3, shoulders: 0.5, triceps: 1.5 },
    [bench([10, 60]), entry('Pushups', 'bodyweight', sets([15]))],
    { energy: 2, bodyWeightKg: 83.2 },
  ),
  workout(day(31, 9), 1800, { lats: 1 }),
  workout(day(2), 3000, { chest: 2, triceps: 1 }, [bench([10, 50], [8, 60])], {
    wellbeing: 4,
    energy: 3,
    bodyWeightKg: 84,
  }),
  workout(day(11, 10, 10), 1200, { abdominals: 2 }, [
    entry('Plank', 'timed', [{ n: 1, durationSec: 60, at: Timestamp.fromDate(now) }]),
  ]),
  workout(day(8, 10, 23), 1500, { lats: 4 }),
  workout(day(4), 2400, { chest: 2 }, [bench([8, 60], [6, 62.5])], { wellbeing: 5 }),
]

describe('dates', () => {
  it('finds Monday and steps by calendar day across the DST change', () => {
    expect(weekStart(now)).toEqual(new Date(2026, 10, 9))
    expect(weekStart(new Date(2026, 10, 8, 23))).toEqual(new Date(2026, 10, 2))
    expect(addDays(new Date(2026, 9, 24), 2)).toEqual(new Date(2026, 9, 26))
  })
})

describe('weekMuscleLoad', () => {
  it('sums sets from Monday to now and lists untrained muscles', () => {
    const load = weekMuscleLoad(workouts, now)

    expect(load.from).toEqual(new Date(2026, 10, 9))
    expect(load.workouts).toBe(2)
    expect(load.sets).toMatchObject({ chest: 3, shoulders: 0.5, triceps: 1.5, abdominals: 2 })
    expect(load.sets.lats).toBe(0)
    expect(load.untrained).toHaveLength(13)
    expect(load.untrained).toContain('lats')
    expect(load.untrained).not.toContain('chest')
    // Eye exercises are not on the map, so eyes are never «untrained».
    expect(load.untrained).not.toContain('eyes')
  })

  it('treats a week without workouts as all untrained', () => {
    expect(weekMuscleLoad([], now).untrained).toHaveLength(17)
  })
})

describe('calendar', () => {
  it('builds November with workout days, today and future days', () => {
    const cal = monthCalendar(workouts, new Date(2026, 10, 1), now)

    expect(cal.lead).toBe(6)
    expect(cal.days).toHaveLength(30)
    expect(cal.count).toBe(5)
    expect(cal.days[1]?.workouts.map((w) => w.summary?.durationSec)).toEqual([3000])
    expect(cal.days[2]?.workouts).toEqual([])
    expect(cal.days[10]).toMatchObject({ today: true, future: false })
    expect(cal.days[11]).toMatchObject({ today: false, future: true })
  })

  it('counts this week, total time and the first month', () => {
    expect(workoutsThisWeek(workouts, now)).toBe(2)
    expect(totalDurationSec(workouts)).toBe(13_500)
    expect(firstMonth(workouts)).toEqual(new Date(2026, 9, 1))
    expect(firstMonth([])).toBeNull()
  })
})

describe('exercise progress', () => {
  it('lists rep-based exercises with history, most recent first', () => {
    expect(exercisesWithHistory(workouts)).toEqual([
      { exerciseId: 'Bench', name: 'Bench' },
      { exerciseId: 'Pushups', name: 'Pushups' },
    ])
  })

  it('builds per-workout top weight, volume and reps with dated records', () => {
    const { points, records } = exerciseProgress(workouts, 'Bench')

    expect(points).toEqual([
      { date: day(2), topWeightKg: 60, volumeKg: 980, reps: 18 },
      { date: day(4), topWeightKg: 62.5, volumeKg: 855, reps: 14 },
      { date: day(9, 10, 7), topWeightKg: 60, volumeKg: 600, reps: 10 },
    ])
    expect(records.maxWeightKg).toEqual({ value: 62.5, date: day(4) })
    expect(records.maxVolumeKg).toEqual({ value: 980, date: day(2) })
    expect(records.bestSet).toEqual({
      value: { reps: 10, weightKg: 60, e1rmKg: 80 },
      date: day(9, 10, 7),
    })
  })

  it('ignores a 0-rep attempt for the top weight and the records', () => {
    const failed = [workout(day(5), 600, {}, [bench([0, 120], [5, 100])])]

    const { points, records } = exerciseProgress(failed, 'Bench')

    expect(points[0]).toMatchObject({ topWeightKg: 100, reps: 5 })
    expect(records.maxWeightKg?.value).toBe(100)
    expect(records.bestSet?.value).toMatchObject({ reps: 5, weightKg: 100 })
  })

  it('has reps but no weight records for a bodyweight exercise', () => {
    expect(exerciseProgress(workouts, 'Pushups')).toEqual({
      points: [{ date: day(9, 10, 7), topWeightKg: 0, volumeKg: 0, reps: 15 }],
      records: { maxWeightKg: null, maxVolumeKg: null, bestSet: null },
    })
  })
})

describe('body and survey', () => {
  it('charts body weight in date order', () => {
    expect(bodyWeightSeries(workouts)).toEqual([
      { date: day(2), kg: 84 },
      { date: day(9, 10, 7), kg: 83.2 },
    ])
  })

  it('averages wellbeing and energy per week', () => {
    expect(weeklySurvey(workouts)).toEqual([
      { week: new Date(2026, 10, 2), wellbeing: 4.5, energy: 3 },
      { week: new Date(2026, 10, 9), wellbeing: null, energy: 2 },
    ])
  })
})
