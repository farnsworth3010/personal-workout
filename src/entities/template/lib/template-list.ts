import type { Equipment, TemplateEntry, TemplateRef } from '@/shared/api'

import type { ListedTemplate, Place } from '../model/types'
import { placeOf, type ExerciseFactsById } from './derive'

interface Named {
  id: string
  name: string
  entries: TemplateEntry[]
  // Ready-made sets declare it; own sets don't, so theirs is derived from equipment.
  place?: Place
}

/** A stable string for a ref: React keys, Set and Map lookups. */
export const refKey = (ref: TemplateRef) => `${ref.source}/${ref.id}`

/** Documents as list rows with their place; undefined stays undefined (not loaded). */
export function listTemplates(
  source: TemplateRef['source'],
  templates: readonly Named[] | undefined,
  byId: ExerciseFactsById,
  homeEquipment: readonly Equipment[],
): ListedTemplate[] | undefined {
  return templates?.map(({ id, name, entries, place }) => ({
    ref: { source, id },
    name,
    entries,
    place: place ?? placeOf({ entries }, byId, homeEquipment),
  }))
}
