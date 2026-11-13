import { muscleGroupsText, type ExercisesById } from '@/entities/exercise'
import { weekdays } from '@/entities/profile'
import {
  estimateDurationMin,
  muscleGroupsOf,
  placeLabels,
  type ListedTemplate,
  type TemplateEntry,
  type TemplateRef,
} from '@/entities/template'
import type { Profile } from '@/shared/api'
import { plural } from '@/shared/lib'

import { weekdayDatives } from '../config/weekdays'

export const exercisesWord = (n: number) =>
  `${n} ${plural(n, ['упражнение', 'упражнения', 'упражнений'])}`

export const musclesText = (entries: TemplateEntry[], byId: ExercisesById) =>
  muscleGroupsText(muscleGroupsOf({ entries }, byId), { capitalizeFirst: true })

export const daysText = (ref: TemplateRef, schedule: Profile['schedule'] | undefined) => {
  const days = weekdays
    .filter((day) => schedule?.[day].some((r) => r.source === ref.source && r.id === ref.id))
    .map((day) => weekdayDatives[day])

  return days.length > 0 ? `по ${days.join(', ')}` : null
}

// Place, exercise count, time and muscles, as the list row shows them.
export const setSummary = (set: ListedTemplate, byId: ExercisesById) =>
  [
    placeLabels[set.place],
    exercisesWord(set.entries.length),
    `~${estimateDurationMin(set, byId)} мин`,
    musclesText(set.entries, byId),
  ]
    .filter(Boolean)
    .join(' · ')
