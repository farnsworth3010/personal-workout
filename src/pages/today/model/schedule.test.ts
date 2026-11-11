import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import type { ReadyTemplate } from '@/entities/template'
import type { Profile, Workout } from '@/shared/api'

import {
  counterpartOf,
  dayPlan,
  nextPlanned,
  plannedFor,
  variantFor,
  weekdayOf,
  weekView,
} from './schedule'

// Wednesday 11 November 2026, local time.
const wed = new Date(2026, 10, 11, 9)

const upper = { source: 'own', id: 'upper' } as const
const fullGym = { source: 'ready', id: 'gym-full-body' } as const
const warmUp = { source: 'ready', id: 'warm-up' } as const
const backCare = { source: 'ready', id: 'back-care' } as const

const empty: Profile['schedule'] = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
const schedule: Profile['schedule'] = {
  ...empty,
  mon: [upper],
  wed: [warmUp, backCare, fullGym],
  fri: [upper, warmUp],
}

const ready = (id: string, place: ReadyTemplate['place'], pairId?: string): ReadyTemplate => ({
  id,
  name: id,
  place,
  ...(pairId ? { pairId } : {}),
  entries: [{ id: 'e1', exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 90 }],
})

const readyTemplates = [
  ready('home-bodyweight', 'home', 'full-body'),
  ready('gym-full-body', 'gym', 'full-body'),
  ready('gym-push', 'gym'),
]

const workout = (
  date: Date,
  ref: { source: 'own' | 'ready'; id: string },
  status: Workout['status'] = 'done',
): Workout => ({
  status,
  startedAt: Timestamp.fromDate(date),
  endedAt: status === 'done' ? Timestamp.fromDate(date) : null,
  template: { ...ref, name: ref.id },
  entries: [],
  survey: {},
  summary: null,
  updatedAt: Timestamp.fromDate(date),
})

const workouts = [
  workout(new Date(2026, 10, 9, 7), upper),
  workout(new Date(2026, 10, 8, 23), upper),
  workout(new Date(2026, 10, 11, 7), warmUp),
  workout(new Date(2026, 10, 11, 7, 30), { source: 'own', id: 'back-care' }),
  workout(new Date(2026, 10, 11, 8), backCare, 'active'),
]

describe('today', () => {
  it('maps dates to weekdays with Monday first', () => {
    expect(weekdayOf(new Date(2026, 10, 9))).toBe('mon')
    expect(weekdayOf(new Date(2026, 10, 15, 23, 59))).toBe('sun')
  })

  it("takes today's sets from the schedule in order", () => {
    expect(plannedFor(schedule, wed)).toEqual([warmUp, backCare, fullGym])
    expect(plannedFor(schedule, new Date(2026, 10, 12))).toEqual([])
  })
})

describe('dayPlan', () => {
  it('marks sets done by a finished workout of the same source and id that day', () => {
    expect(dayPlan(schedule, workouts, wed)).toEqual({
      sets: [
        { ref: warmUp, done: true, workout: workouts[2] },
        { ref: backCare, done: false, workout: null },
        { ref: fullGym, done: false, workout: null },
      ],
      current: 1,
      state: 'partly',
    })
  })

  it('needs one finished workout per planned copy of a set', () => {
    const twice = { ...empty, wed: [warmUp, warmUp] }

    expect(dayPlan(twice, workouts, wed).sets.map((s) => s.done)).toEqual([true, false])
  })

  it('counts the home/gym counterpart of a ready-made set as done', () => {
    const homeVariant = workout(new Date(2026, 10, 11, 19), {
      source: 'ready',
      id: 'home-bodyweight',
    })

    expect(dayPlan(schedule, [homeVariant], wed).sets[2]?.done).toBe(false)
    expect(dayPlan(schedule, [homeVariant], wed, readyTemplates).sets[2]).toEqual({
      ref: fullGym,
      done: true,
      workout: homeVariant,
    })
  })

  it('gives a workout to its own planned set before a counterpart', () => {
    const homeRef = { source: 'ready', id: 'home-bodyweight' } as const
    const both = { ...empty, wed: [fullGym, homeRef] }
    const home = workout(new Date(2026, 10, 11, 7), homeRef)

    expect(dayPlan(both, [home], wed, readyTemplates).sets.map((s) => s.done)).toEqual([
      false,
      true,
    ])
  })

  it('reports rest, planned and done days', () => {
    expect(dayPlan(schedule, workouts, new Date(2026, 10, 10))).toEqual({
      sets: [],
      current: null,
      state: 'rest',
    })
    expect(dayPlan(schedule, workouts, new Date(2026, 10, 13)).state).toBe('planned')
    expect(dayPlan(schedule, workouts, new Date(2026, 10, 9))).toMatchObject({
      current: null,
      state: 'done',
    })
  })
})

describe('nextPlanned', () => {
  it('finds the next day with sets this week', () => {
    expect(nextPlanned(schedule, wed)).toEqual({
      date: new Date(2026, 10, 13),
      refs: [upper, warmUp],
    })
  })

  it('wraps into next week', () => {
    expect(nextPlanned(schedule, new Date(2026, 10, 14))).toEqual({
      date: new Date(2026, 10, 16),
      refs: [upper],
    })
  })

  it('returns the same weekday next week when only today is planned', () => {
    expect(nextPlanned({ ...empty, wed: [warmUp] }, wed)?.date).toEqual(new Date(2026, 10, 18))
  })

  it('returns null for an empty schedule', () => {
    expect(nextPlanned(empty, wed)).toBeNull()
  })
})

describe('weekView', () => {
  it('lists Monday to Sunday with day states and set counts', () => {
    const week = weekView(schedule, workouts, wed)

    expect(week.days.map((d) => d.date.getDate())).toEqual([9, 10, 11, 12, 13, 14, 15])
    expect(week.days.map((d) => d.weekday)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
    ])
    expect(week.days.map((d) => d.state)).toEqual([
      'done',
      'rest',
      'partly',
      'rest',
      'planned',
      'rest',
      'rest',
    ])
    expect(week.days.map((d) => d.today)).toEqual([false, false, true, false, false, false, false])
    expect(week).toMatchObject({ planned: 6, done: 2 })
  })
})

describe('home/gym pair', () => {
  it('finds the counterpart through pairId', () => {
    expect(counterpartOf(fullGym, readyTemplates)?.id).toBe('home-bodyweight')
    expect(counterpartOf({ source: 'ready', id: 'gym-push' }, readyTemplates)).toBeNull()
    expect(counterpartOf(upper, readyTemplates)).toBeNull()
  })

  it('swaps to the variant for the chosen place', () => {
    expect(variantFor(fullGym, 'home', readyTemplates)).toEqual({
      source: 'ready',
      id: 'home-bodyweight',
    })
    expect(variantFor(fullGym, 'gym', readyTemplates)).toEqual(fullGym)
    expect(variantFor(upper, 'home', readyTemplates)).toEqual(upper)
  })
})
