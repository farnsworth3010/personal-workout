import type { Workout } from '@/shared/api'

export const workoutDate = (w: Workout) => w.startedAt.toDate()

export const byDate = <W extends Workout>(workouts: readonly W[]) =>
  [...workouts].sort((a, b) => a.startedAt.toMillis() - b.startedAt.toMillis())

/** Workouts started in [from, to). */
export const between = <W extends Workout>(workouts: readonly W[], from: Date, to: Date) =>
  workouts.filter((w) => {
    const t = w.startedAt.toMillis()
    return t >= from.getTime() && t < to.getTime()
  })
