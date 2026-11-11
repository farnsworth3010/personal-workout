import { muscleLabels, type Exercise } from '@/entities/exercise'
import type { Place, TemplateEntry } from '@/entities/template'

export const placeLabel = (place: Place) => (place === 'home' ? 'Дома' : 'Зал')

export const setCount = (entries: readonly TemplateEntry[]) =>
  entries.reduce((n, e) => n + e.sets, 0)

export const planLine = (entry: TemplateEntry) =>
  entry.durationSec === undefined
    ? `${entry.sets} × ${entry.reps ?? 0}`
    : `${entry.sets} × ${entry.durationSec} с`

export const musclesOf = (exercise: Exercise | undefined) =>
  exercise?.primaryMuscles.map((m) => muscleLabels[m].toLocaleLowerCase('ru')).join(', ') ?? ''

export const weekdayName = (date: Date) => date.toLocaleDateString('ru', { weekday: 'long' })

export const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('ru') + text.slice(1)

export const clock = (date: Date) =>
  date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
