import { useMemo } from 'react'

import { muscleLabels, useCatalog, type Equipment, type Exercise } from '@/entities/exercise'
import {
  placeOf,
  useOwnTemplates,
  useReadyTemplates,
  type Place,
  type TemplateEntry,
  type TemplateRef,
} from '@/entities/template'

export interface SetInfo {
  ref: TemplateRef
  name: string
  entries: TemplateEntry[]
  place: Place
}

export type ExercisesById = Record<string, Exercise | undefined>

export const refKey = (ref: TemplateRef) => `${ref.source}/${ref.id}`

// Own and ready-made sets behind one lookup by ref; own ones first, as the person made them.
export function useSets(uid: string, homeEquipment: readonly Equipment[]) {
  const { data: catalog } = useCatalog()
  const { data: ready } = useReadyTemplates()
  const { data: own } = useOwnTemplates(uid)

  return useMemo(() => {
    const byId: ExercisesById = Object.fromEntries((catalog ?? []).map((e) => [e.id, e]))
    const info = (ref: TemplateRef, name: string, entries: TemplateEntry[]): SetInfo => ({
      ref,
      name,
      entries,
      place: placeOf({ entries }, byId, homeEquipment),
    })

    const all = [
      ...(own ?? []).map((t) => info({ source: 'own', id: t.id }, t.name, t.entries)),
      ...(ready ?? []).map((t) => info({ source: 'ready', id: t.id }, t.name, t.entries)),
    ]
    const byRef = new Map(all.map((set) => [refKey(set.ref), set]))

    return {
      all,
      byId,
      ready: ready ?? [],
      loaded: catalog !== undefined && ready !== undefined && own !== undefined,
      find: (ref: TemplateRef) => byRef.get(refKey(ref)),
    }
  }, [catalog, ready, own, homeEquipment])
}

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

export const mass = (kg: number) =>
  kg >= 1000
    ? { value: (kg / 1000).toLocaleString('ru', { maximumFractionDigits: 1 }), unit: 'т' }
    : { value: Math.round(kg).toLocaleString('ru'), unit: 'кг' }

export const cta = 'h-auto min-h-16 rounded-lg border-0 text-lg font-bold uppercase'

export const ghost =
  'h-auto min-h-12 rounded-lg bg-surface text-sm font-normal min-[900px]:min-h-16 min-[900px]:px-6'
