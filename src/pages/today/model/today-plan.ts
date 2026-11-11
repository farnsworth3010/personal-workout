import type { Place, ReadyTemplate, TemplateRef } from '@/entities/template'
import type { Profile, WithId, Workout } from '@/shared/api'

import { counterpartOf, dayPlan, nextPlanned, variantFor, weekdays, weekView } from './schedule'
import { refKey, type SetInfo } from './sets'

interface Sets {
  ready: readonly ReadyTemplate[]
  find: (ref: TemplateRef) => SetInfo | undefined
}

// Everything Today shows, derived from the profile's schedule, the sets and the recent workouts.
export function todayPlan(
  profileSchedule: Profile['schedule'],
  sets: Sets,
  workouts: readonly WithId<Workout>[],
  now: Date,
  mode: Place | null,
) {
  // A ref to an own set deleted elsewhere is skipped; the next edit of that day drops it for good.
  const schedule = Object.fromEntries(
    weekdays.map((day) => [day, profileSchedule[day].filter((ref) => sets.find(ref))]),
  ) as Profile['schedule']
  const plan = dayPlan(schedule, workouts, now, sets.ready)
  const week = weekView(schedule, workouts, now, sets.ready)

  const pairedRef = plan.sets.find((s) => counterpartOf(s.ref, sets.ready))?.ref
  const place = mode ?? sets.ready.find((t) => t.id === pairedRef?.id)?.place ?? 'gym'

  const items = plan.sets.map((s) => {
    const ref = s.done ? s.ref : variantFor(s.ref, place, sets.ready)
    const swapped = refKey(ref) !== refKey(s.ref)

    return {
      set: sets.find(ref),
      doneAt: s.workout && (s.workout.endedAt ?? s.workout.startedAt).toDate(),
      workoutId: s.workout?.id,
      swappedTo: swapped ? (place === 'home' ? 'дома' : 'зала') : undefined,
    }
  })

  return {
    schedule,
    plan,
    week,
    paired: pairedRef !== undefined,
    place,
    items,
    doneCount: plan.sets.filter((s) => s.done).length,
    next: plan.sets.length === 0 ? nextPlanned(schedule, now) : null,
    planEmpty: weekdays.every((day) => schedule[day].length === 0),
    planned: new Set(items.flatMap(({ set }) => (set ? [refKey(set.ref)] : []))),
  }
}
