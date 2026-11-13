import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { defaultProfile } from '@/entities/profile'
import {
  refKey,
  type ListedTemplate,
  type Place,
  type ReadyTemplate,
  type TemplateRef,
} from '@/entities/template'
import type { Profile, WithId, Workout } from '@/shared/api'

import { todayPlan } from './today-plan'

// Wednesday 11 November 2026, noon.
const wed = new Date(2026, 10, 11, 12)
const thu = new Date(2026, 10, 12, 12)

const ref = (id: string, source: TemplateRef['source'] = 'ready'): TemplateRef => ({ source, id })
const warmup = ref('warmup')
const back = ref('back')
const backHome = ref('back-home')
const stretch = ref('stretch')
const ownHome = ref('o-home', 'own')
const ownGym = ref('o-gym', 'own')
const deleted = ref('gone', 'own')

const entries = [{ id: 'e1', exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 60 }]
const readyTemplates: ReadyTemplate[] = [
  { id: 'warmup', name: 'Разминка', place: 'home', entries },
  { id: 'back', name: 'Спина', place: 'gym', pairId: 'b', entries },
  { id: 'back-home', name: 'Спина дома', place: 'home', pairId: 'b', entries },
  { id: 'stretch', name: 'Растяжка', place: 'home', entries },
]
const listed: ListedTemplate[] = [
  { ref: ownHome, name: 'Мой дома', place: 'home', entries },
  { ref: ownGym, name: 'Мой в зале', place: 'gym', entries },
  { ref: warmup, name: 'Разминка', place: 'home', entries },
  { ref: back, name: 'Спина', place: 'gym', entries },
  { ref: backHome, name: 'Спина дома', place: 'home', entries },
  { ref: stretch, name: 'Растяжка', place: 'home', entries },
]
const byRef = new Map(listed.map((set) => [refKey(set.ref), set]))
const sets = { readyTemplates, find: (r: TemplateRef) => byRef.get(refKey(r)) }

const plan = (
  schedule: Partial<Profile['schedule']>,
  place: Place | null,
  workouts: WithId<Workout>[] = [],
  now = wed,
) =>
  todayPlan({ schedule: { ...defaultProfile.schedule, ...schedule } }, sets, workouts, now, place)

const names = (result: ReturnType<typeof plan>) => result.items.map((item) => item.set?.name)

const done = (id: string, template: TemplateRef, hour: number): WithId<Workout> => {
  const at = Timestamp.fromDate(new Date(2026, 10, 11, hour))

  return {
    id,
    status: 'done',
    startedAt: at,
    endedAt: at,
    template: { ...template, name: template.id },
    entries: [],
    survey: {},
    summary: null,
    updatedAt: at,
  }
}

describe('todayPlan', () => {
  it("takes today's weekday and skips refs to deleted own sets", () => {
    const result = plan({ wed: [deleted, warmup, ownHome], fri: [back] }, 'home')

    expect(result.schedule.wed).toEqual([warmup, ownHome])
    expect(names(result)).toEqual(['Разминка', 'Мой дома'])
    expect(result).toMatchObject({ rest: false, next: null, planEmpty: false })
  })

  it('points a rest day at the next planned day', () => {
    const result = plan({ wed: [warmup], fri: [back] }, null, [], thu)

    expect(result.rest).toBe(true)
    expect(result.next?.date.toDateString()).toBe(new Date(2026, 10, 13).toDateString())
    expect(result.next?.refs).toEqual([back])
  })

  it('reports an empty plan when every planned set was deleted', () => {
    expect(plan({ wed: [deleted] }, null)).toMatchObject({ rest: true, planEmpty: true })
  })

  describe('place', () => {
    it('uses the chosen place', () => {
      expect(plan({ wed: [warmup, back] }, 'gym').place).toBe('gym')
    })

    it("falls back to the place of today's first set, then to the gym", () => {
      expect(plan({ wed: [warmup, back] }, null).place).toBe('home')
      expect(plan({ wed: [back, warmup] }, null).place).toBe('gym')
      expect(plan({}, null).place).toBe('gym')
    })
  })

  describe('filter by place', () => {
    const day = { wed: [warmup, back, ownGym, ownHome] }

    it('shows only the sets for the place, a pair as its variant', () => {
      expect(names(plan(day, 'gym'))).toEqual(['Спина', 'Мой в зале'])
      expect(names(plan(day, 'home'))).toEqual(['Разминка', 'Спина дома', 'Мой дома'])
    })

    it('marks a swapped pair and counts it as planned', () => {
      const result = plan(day, 'home')

      expect(result.items.map((item) => item.swappedTo)).toEqual([undefined, 'дома', undefined])
      expect(result.planned.has('ready/back-home')).toBe(true)
      expect(result.planned.has('ready/back')).toBe(false)
    })

    it('filters a ready-made set by its declared place', () => {
      expect(names(plan({ wed: [stretch] }, 'home'))).toEqual(['Растяжка'])
      expect(names(plan({ wed: [stretch] }, 'gym'))).toEqual([])
    })

    it('leaves a planned day without sets for the place empty, not a rest day', () => {
      const result = plan({ wed: [warmup] }, 'gym')

      expect(result.items).toEqual([])
      expect(result).toMatchObject({ rest: false, plan: { state: 'rest', current: null } })
    })

    it('filters every day of the week the same way', () => {
      const result = plan({ wed: [warmup, back], fri: [stretch] }, 'gym', [done('w0', warmup, 7)])
      const wedDay = result.week.days[2]
      const friDay = result.week.days[4]

      expect(wedDay.sets.map((s) => s.ref)).toEqual([back])
      expect(wedDay.state).toBe('planned')
      expect(friDay.state).toBe('rest')
    })
  })

  it('counts a finished counterpart as the planned set at either place', () => {
    const workout = done('w1', backHome, 9)
    const doneAt = workout.endedAt?.toDate()

    const home = plan({ wed: [warmup, back] }, 'home', [workout])
    expect(home.doneCount).toBe(1)
    expect(home.plan).toMatchObject({ state: 'partly', current: 0 })
    expect(home.items[1]).toEqual({
      set: byRef.get('ready/back-home'),
      doneAt,
      workoutId: 'w1',
      swappedTo: 'дома',
    })

    const gym = plan({ wed: [warmup, back] }, 'gym', [workout])
    expect(gym.items).toEqual([
      { set: byRef.get('ready/back'), doneAt, workoutId: 'w1', swappedTo: undefined },
    ])
    expect(gym.plan.state).toBe('done')
  })
})
