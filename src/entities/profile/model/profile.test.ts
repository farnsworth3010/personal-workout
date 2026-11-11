import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { profileSchema } from '@/shared/api'

import { defaultProfile, mergeProfile, withDefaults } from './profile'

const now = Timestamp.fromMillis(1_700_000_000_000)
const legDay = { source: 'ready', id: 'gym-legs' } as const
const upperDay = { source: 'own', id: 't1' } as const

describe('profile defaults', () => {
  it('match data-model.md and pass the schema', () => {
    expect(profileSchema.parse(defaultProfile)).toEqual(defaultProfile)
    expect(defaultProfile).toMatchObject({
      homeEquipment: [],
      defaultRestSec: 90,
      defaultWeightStepKg: 2.5,
      sounds: true,
      animations: true,
      activeWorkoutId: null,
      timers: { exercise: true, rest: true, workout: true },
    })
    expect(Object.values(defaultProfile.schedule)).toEqual(Array(7).fill([]))
  })

  it('stand in only for a missing document', () => {
    const stored = { ...defaultProfile, sounds: false }

    expect(withDefaults(null)).toBe(defaultProfile)
    expect(withDefaults(stored)).toBe(stored)
  })
})

describe('mergeProfile', () => {
  it('replaces top-level fields and stamps updatedAt', () => {
    const next = mergeProfile(defaultProfile, { homeEquipment: ['dumbbell'], sounds: false }, now)

    expect(next).toEqual({
      ...defaultProfile,
      homeEquipment: ['dumbbell'],
      sounds: false,
      updatedAt: now,
    })
    expect(defaultProfile.homeEquipment).toEqual([])
  })

  it('merges schedule days instead of replacing the week', () => {
    const monday = mergeProfile(defaultProfile, { schedule: { mon: [legDay] } }, now)
    const both = mergeProfile(monday, { schedule: { fri: [legDay, upperDay] } }, now)

    expect(both.schedule).toEqual({
      ...defaultProfile.schedule,
      mon: [legDay],
      fri: [legDay, upperDay],
    })
  })

  it('merges one timer switch, keeping the others', () => {
    const merged = mergeProfile(defaultProfile, { timers: { rest: false } }, now)

    expect(merged.timers).toEqual({ exercise: true, rest: false, workout: true })
    expect(profileSchema.safeParse(merged).success).toBe(true)
  })

  it('replaces a day with its new list and keeps a whole valid document', () => {
    const monday = mergeProfile(defaultProfile, { schedule: { mon: [legDay, upperDay] } }, now)
    const reordered = mergeProfile(monday, { schedule: { mon: [upperDay, legDay] } }, now)
    const cleared = mergeProfile(reordered, { schedule: { mon: [] } }, now)

    expect(reordered.schedule.mon).toEqual([upperDay, legDay])
    expect(cleared.schedule.mon).toEqual([])
    expect(profileSchema.safeParse(cleared).success).toBe(true)
  })
})
