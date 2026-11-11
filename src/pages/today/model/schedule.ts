import type { Place, ReadyTemplate, TemplateRef } from '@/entities/template'
import type { Profile, Workout } from '@/shared/api'

type Schedule = Profile['schedule']
export type Weekday = keyof Schedule

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

// Local calendar days: steps by date, not by 24 h, so DST changes do not shift them.
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const weekdayOf = (date: Date): Weekday => weekdays[(date.getDay() + 6) % 7]

export const plannedFor = (schedule: Schedule, date: Date) => schedule[weekdayOf(date)]

/** The first day after `date` with planned sets, up to the same weekday next week. */
export function nextPlanned(schedule: Schedule, date: Date) {
  for (let i = 1; i <= 7; i++) {
    const day = addDays(date, i)
    const refs = plannedFor(schedule, day)
    if (refs.length > 0) return { date: day, refs }
  }

  return null
}

export type DayState = 'rest' | 'planned' | 'partly' | 'done'

const sameRef = (a: TemplateRef, b: TemplateRef) => a.source === b.source && a.id === b.id

/**
 * The sets planned for `date`, each with the finished workout that did it that day: one of the same
 * template, or of its home/gym counterpart. `current` is the index of the first set not done yet.
 */
export function dayPlan<W extends Workout>(
  schedule: Schedule,
  workouts: readonly W[],
  date: Date,
  ready: readonly ReadyTemplate[] = [],
) {
  const left = workouts
    .filter((w) => w.status === 'done' && sameDay(w.startedAt.toDate(), date))
    .sort((a, b) => a.startedAt.toMillis() - b.startedAt.toMillis())
  const refs = plannedFor(schedule, date)
  const matched: (W | null)[] = refs.map(() => null)

  // Exact templates first, so a counterpart never takes a workout that has its own planned set.
  const take = (i: number, fits: (w: W) => boolean) => {
    const at = left.findIndex(fits)
    if (at < 0) return

    matched[i] = left[at] ?? null
    left.splice(at, 1)
  }
  refs.forEach((ref, i) => take(i, (w) => sameRef(w.template, ref)))
  refs.forEach((ref, i) => {
    const counterpart = counterpartOf(ref, ready)
    if (matched[i] === null && counterpart) {
      take(i, (w) => sameRef(w.template, { source: 'ready', id: counterpart.id }))
    }
  })

  const sets = refs.map((ref, i) => {
    const workout = matched[i] ?? null
    return { ref, done: workout !== null, workout }
  })

  const doneCount = sets.filter((s) => s.done).length
  const current = sets.findIndex((s) => !s.done)
  const state: DayState =
    sets.length === 0
      ? 'rest'
      : doneCount === sets.length
        ? 'done'
        : doneCount > 0
          ? 'partly'
          : 'planned'

  return { sets, current: current < 0 ? null : current, state }
}

/** Monday to Sunday of the week of `date`; `planned` and `done` count sets, not days. */
export function weekView<W extends Workout>(
  schedule: Schedule,
  workouts: readonly W[],
  date: Date,
  ready: readonly ReadyTemplate[] = [],
) {
  const monday = addDays(date, -((date.getDay() + 6) % 7))

  const days = weekdays.map((weekday, i) => {
    const day = addDays(monday, i)
    return {
      date: day,
      weekday,
      today: sameDay(day, date),
      ...dayPlan(schedule, workouts, day, ready),
    }
  })

  return {
    days,
    planned: days.reduce((n, d) => n + d.sets.length, 0),
    done: days.reduce((n, d) => n + d.sets.filter((s) => s.done).length, 0),
  }
}

/** The ready-made set for the other place that shares `ref`'s pairId; own sets have none. */
export function counterpartOf(ref: TemplateRef, ready: readonly ReadyTemplate[]) {
  if (ref.source !== 'ready') return null

  const template = ready.find((t) => t.id === ref.id)
  if (!template?.pairId) return null

  return ready.find((t) => t.pairId === template.pairId && t.place !== template.place) ?? null
}

/** `ref`, or its counterpart when it is a ready-made set for the other place. */
export function variantFor(
  ref: TemplateRef,
  place: Place,
  ready: readonly ReadyTemplate[],
): TemplateRef {
  const counterpart = counterpartOf(ref, ready)

  return counterpart?.place === place ? { source: 'ready', id: counterpart.id } : ref
}
