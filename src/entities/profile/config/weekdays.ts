import type { Profile } from '@/shared/api'

// The keys of profile.schedule.
export type Weekday = keyof Profile['schedule']

/** Monday first, as the schedule and the week rows show them. */
export const weekdays: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
