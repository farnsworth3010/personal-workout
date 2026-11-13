import { weekdays } from '@/entities/profile'
import {
  refKey,
  type ListedTemplate,
  type Place,
  type ReadyTemplate,
  type TemplateRef,
} from '@/entities/template'
import type { Profile, WithId, Workout } from '@/shared/api'

import { dayPlan, dayState, firstUndone, nextPlanned, variantFor, weekView } from './schedule'
import type { TodaySet } from './types'

interface Sets {
  readyTemplates: readonly ReadyTemplate[]
  find: (ref: TemplateRef) => ListedTemplate | undefined
}

// Everything Today shows, derived from the profile's schedule, the sets and the recent workouts.
// `chosen` is the device's place; until one is chosen, the place of today's first set.
export function todayPlan(
  profile: Pick<Profile, 'schedule'>,
  sets: Sets,
  workouts: readonly WithId<Workout>[],
  now: Date,
  chosen: Place | null,
) {
  const ready = sets.readyTemplates
  const placeOf = (ref: TemplateRef) => sets.find(ref)?.place

  // A ref to an own set deleted elsewhere is skipped; the next edit of that day drops it for good.
  const schedule = Object.fromEntries(
    weekdays.map((day) => [day, profile.schedule[day].filter((ref) => sets.find(ref))]),
  ) as Profile['schedule']
  const day = dayPlan(schedule, workouts, now, ready)
  const place = chosen ?? (day.sets[0] && placeOf(day.sets[0].ref)) ?? 'gym'

  // A day's sets for `place`: a pair as the place's variant, any other set only when it is for the place.
  const forPlace = <S extends { ref: TemplateRef }>(daySets: readonly S[]) =>
    daySets.flatMap((s) => {
      const ref = variantFor(s.ref, place, ready)
      return placeOf(ref) === place ? [{ ...s, ref, swapped: refKey(ref) !== refKey(s.ref) }] : []
    })

  const shown = forPlace(day.sets)
  const week = weekView(schedule, workouts, now, ready)
  const days = week.days.map((d) => {
    const daySets = forPlace(d.sets)
    return { ...d, sets: daySets, state: dayState(daySets) }
  })

  const items = shown.map((s): TodaySet => ({
    set: sets.find(s.ref),
    doneAt: s.workout && (s.workout.endedAt ?? s.workout.startedAt).toDate(),
    workoutId: s.workout?.id,
    swappedTo: s.swapped ? (place === 'home' ? 'дома' : 'зала') : undefined,
  }))

  return {
    schedule,
    // Today's sets for the place; `rest` is a day with no sets at all.
    plan: { sets: shown, current: firstUndone(shown), state: dayState(shown) },
    rest: day.sets.length === 0,
    week: { days },
    place,
    items,
    doneCount: shown.filter((s) => s.done).length,
    next: day.sets.length === 0 ? nextPlanned(schedule, now) : null,
    planEmpty: weekdays.every((d) => schedule[d].length === 0),
    planned: new Set(items.flatMap(({ set }) => (set ? [refKey(set.ref)] : []))),
  }
}
