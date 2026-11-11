import type { Workout } from '@/shared/api'

// Calendar arithmetic in local time: days step by date, not by 24 h, so DST changes do not shift them.
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Monday of the week that contains `d`. */
export const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))

export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

export const workoutDate = (w: Workout) => w.startedAt.toDate()

export const byDate = <W extends Workout>(workouts: readonly W[]) =>
  [...workouts].sort((a, b) => a.startedAt.toMillis() - b.startedAt.toMillis())

/** Workouts started in [from, to). */
export const between = <W extends Workout>(workouts: readonly W[], from: Date, to: Date) =>
  workouts.filter((w) => {
    const t = w.startedAt.toMillis()
    return t >= from.getTime() && t < to.getTime()
  })
