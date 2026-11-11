import { useMemo } from 'react'

import { useCatalogById, type Equipment, type Exercise } from '@/entities/exercise'
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
  const { data: catalog } = useCatalogById()
  const { data: ready } = useReadyTemplates()
  const { data: own } = useOwnTemplates(uid)

  return useMemo(() => {
    const byId: ExercisesById = catalog ?? {}
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
