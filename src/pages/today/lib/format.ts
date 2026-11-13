import { muscleGroupsText, type ExercisesById } from '@/entities/exercise'
import {
  estimateDurationMin,
  muscleGroupsOf,
  placeLabels,
  type ListedTemplate,
  type TemplateEntry,
} from '@/entities/template'

import type { Week } from '../model/types'

export const setCount = (entries: readonly TemplateEntry[]) =>
  entries.reduce((n, e) => n + e.sets, 0)

export const weekdayName = (date: Date) => date.toLocaleDateString('ru', { weekday: 'long' })

// home.html's "Зал · спина, поясница": the place and the main muscles of the set.
export const setFocus = (set: ListedTemplate, byId: ExercisesById) =>
  [placeLabels[set.place], muscleGroupsText(muscleGroupsOf(set, byId), { limit: 3 })]
    .filter(Boolean)
    .join(' · ')

export const setMeta = (set: ListedTemplate, byId: ExercisesById) =>
  `${placeLabels[set.place]} · ${set.entries.length} упр. · ~${estimateDurationMin(set, byId)} мин`

export const weekRange = (days: Week['days']) => {
  const first = days[0].date
  const last = days[6].date
  const month = (d: Date) => d.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

  return first.getMonth() === last.getMonth()
    ? `${first.getDate()}–${month(last)}`
    : `${month(first)} – ${month(last)}`
}
