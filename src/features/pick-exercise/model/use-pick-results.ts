import { useMemo, useState } from 'react'

import {
  filterCatalog,
  muscleGroups,
  useCatalog,
  type CatalogChoice,
  type Equipment,
} from '@/entities/exercise'

import { PAGE_SIZE } from '../config/paging'

// The picker's search and filters; paging (not a deferred query) keeps typing responsive, since
// a deferred filter leaves a render where the input already shows the new text over stale rows.
export function usePickResults(homeEquipment: readonly Equipment[]) {
  const [query, setQuery] = useState('')
  const [choice, setChoice] = useState<CatalogChoice>({
    group: null,
    equipment: null,
    homeOnly: false,
  })
  const { group, equipment, homeOnly } = choice
  const { data: catalog } = useCatalog()

  const found = useMemo(
    () =>
      catalog
        ? filterCatalog(
            catalog,
            { query, muscles: group && muscleGroups[group].muscles, equipment, homeOnly },
            homeEquipment,
          )
        : [],
    [catalog, query, group, equipment, homeOnly, homeEquipment],
  )

  // The shown count resets whenever the filter changes.
  const filterKey = `${query}|${group}|${equipment}|${homeOnly}`
  const [shown, setShown] = useState({ key: filterKey, count: PAGE_SIZE })
  const count = shown.key === filterKey ? shown.count : PAGE_SIZE

  return {
    query,
    setQuery,
    choice,
    update: (patch: Partial<CatalogChoice>) => setChoice((current) => ({ ...current, ...patch })),
    loaded: catalog !== undefined,
    found,
    rows: found.slice(0, count),
    hasMore: found.length > count,
    showMore: () => setShown({ key: filterKey, count: count + PAGE_SIZE }),
  }
}
