import { Timestamp } from 'firebase/firestore'

import type { Profile } from '@/shared/api'

export type ProfilePatch = Partial<Omit<Profile, 'schedule' | 'timers' | 'updatedAt'>> & {
  schedule?: Partial<Profile['schedule']>
  timers?: Partial<Profile['timers']>
}

// data-model.md defaults; updatedAt is the epoch so the object stays one stable reference.
export const defaultProfile: Profile = {
  homeEquipment: [],
  defaultRestSec: 90,
  defaultWeightStepKg: 2.5,
  sounds: true,
  animations: true,
  schedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  timers: { exercise: true, rest: true, workout: true },
  updatedAt: Timestamp.fromMillis(0),
}

export const withDefaults = (profile: Profile | null) => profile ?? defaultProfile

export function mergeProfile(current: Profile, patch: ProfilePatch, now: Timestamp): Profile {
  return {
    ...current,
    ...patch,
    schedule: { ...current.schedule, ...patch.schedule },
    timers: { ...current.timers, ...patch.timers },
    updatedAt: now,
  }
}
