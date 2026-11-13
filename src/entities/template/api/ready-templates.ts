import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { limits, templateEntrySchema, withEntryIds } from '@/shared/api'

import type { ReadyTemplate } from '../model/types'

const READY_TEMPLATES_URL = '/catalog/templates.json'

// A malformed entry fails here, as a query error, instead of crashing the pages that render it.
export const readyTemplatesSchema = z.array(
  z.strictObject({
    id: z.string().min(1),
    name: z.string().min(1),
    place: z.enum(['home', 'gym']),
    pairId: z.string().min(1).optional(),
    // The file's own entry ids are kept; an entry without one gets it from its position.
    entries: z.preprocess(
      (entries) => (Array.isArray(entries) ? withEntryIds(entries as object[]) : entries),
      z.array(templateEntrySchema).min(1).max(limits.templateEntries.max),
    ),
  }),
)

export const readyTemplatesQuery = queryOptions({
  queryKey: ['ready-templates'],
  queryFn: async (): Promise<ReadyTemplate[]> => {
    const response = await fetch(READY_TEMPLATES_URL)

    if (!response.ok) throw new Error(`Failed to load ready-made sets: ${response.status}`)

    return readyTemplatesSchema.parse(await response.json())
  },
  staleTime: Infinity,
})

export const useReadyTemplates = () => useQuery(readyTemplatesQuery)
