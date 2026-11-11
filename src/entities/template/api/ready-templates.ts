import { queryOptions, useQuery } from '@tanstack/react-query'

import type { ReadyTemplate } from '../model/types'

export const READY_TEMPLATES_URL = '/catalog/templates.json'

export const readyTemplatesQuery = queryOptions({
  queryKey: ['ready-templates'],
  queryFn: async (): Promise<ReadyTemplate[]> => {
    const response = await fetch(READY_TEMPLATES_URL)

    if (!response.ok) throw new Error(`Failed to load ready-made sets: ${response.status}`)

    return (await response.json()) as ReadyTemplate[]
  },
  staleTime: Infinity,
})

export const useReadyTemplates = () => useQuery(readyTemplatesQuery)
