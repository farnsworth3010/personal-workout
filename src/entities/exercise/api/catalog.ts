import { queryOptions, useQuery } from '@tanstack/react-query'

import type { Exercise } from '../model/types'

export const catalogQuery = queryOptions({
  queryKey: ['catalog', 'exercises'],
  queryFn: async (): Promise<Exercise[]> => {
    const response = await fetch('/catalog/exercises.json')

    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)

    const list = (await response.json()) as Omit<Exercise, 'instructions'>[]

    return list.map((exercise) => ({ ...exercise, instructions: [] }))
  },
  staleTime: Infinity,
})

export function useCatalog() {
  return useQuery(catalogQuery)
}

export function findExercise(catalog: readonly Exercise[], id: string): Exercise | undefined {
  return catalog.find((exercise) => exercise.id === id)
}

export const instructionsQuery = queryOptions({
  queryKey: ['catalog', 'instructions'],
  queryFn: async (): Promise<Record<string, string[] | undefined>> => {
    const response = await fetch('/catalog/instructions.json')

    if (!response.ok) throw new Error(`Instructions request failed: ${response.status}`)

    return (await response.json()) as Record<string, string[] | undefined>
  },
  staleTime: Infinity,
})

// One exercise with its technique steps, which load apart from the list (empty until they arrive).
export function useExercise(id: string) {
  const { data: exercise } = useQuery({
    ...catalogQuery,
    select: (catalog) => findExercise(catalog, id),
  })
  const { data: steps } = useQuery({ ...instructionsQuery, select: (all) => all[id] })

  return { data: exercise && { ...exercise, instructions: steps ?? exercise.instructions } }
}
