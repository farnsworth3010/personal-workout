import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { filterCatalog, muscleGroups, useCatalog } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import { useMediaQuery } from '@/shared/lib'

import { DESKTOP, noEquipment, PAGE_SIZE } from '../config/catalog'
import { emptyText } from '../lib/format'

import { readParams, writeParams, type CatalogParams } from './params'

/** The catalog page's state: URL filters, the deferred search, the shown page and the selection. */
export function useCatalogView(uid: string) {
  const catalog = useCatalog()
  const homeEquipment = useProfile(uid).profile?.homeEquipment ?? noEquipment
  const desktop = useMediaQuery(DESKTOP)

  const [searchParams, setSearchParams] = useSearchParams()
  const { q, group, equipment, homeOnly } = readParams(searchParams)
  // Local state keeps the input in step with the keyboard; the URL follows it.
  const [query, setQuery] = useState(q)
  const deferredQuery = useDeferredValue(query)

  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const update = (patch: Partial<CatalogParams>) => {
    setSearchParams((prev) => writeParams({ ...readParams(prev), ...patch }), { replace: true })
  }

  const search = (value: string) => {
    setQuery(value)
    update({ q: value })
  }

  const reset = () => {
    setQuery('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const visible = useMemo(
    () =>
      catalog.data
        ? filterCatalog(
            catalog.data,
            {
              query: deferredQuery,
              muscles: group && muscleGroups[group].muscles,
              equipment,
              homeOnly,
            },
            homeEquipment,
          )
        : [],
    [catalog.data, deferredQuery, group, equipment, homeOnly, homeEquipment],
  )

  // The shown count resets whenever the filter changes.
  const filterKey = `${deferredQuery}|${group}|${equipment}|${homeOnly}`
  const [shown, setShown] = useState({ key: filterKey, count: PAGE_SIZE })
  const count = shown.key === filterKey ? shown.count : PAGE_SIZE

  // The desktop panel always shows an exercise from the current list.
  const panelId = visible.some((e) => e.id === selected) ? selected : (visible[0]?.id ?? null)
  const current = desktop ? panelId : selected

  const open = (id: string) => {
    setSelected(id)
    if (!desktop) setSheetOpen(true)
  }

  return {
    catalog,
    homeEquipment,
    desktop,
    params: { q, group, equipment, homeOnly },
    query,
    search,
    update,
    reset,
    visible,
    total: catalog.data?.length ?? 0,
    count,
    showMore: () => setShown({ key: filterKey, count: count + PAGE_SIZE }),
    emptyText: emptyText({ q: deferredQuery, group, equipment, homeOnly }),
    panelId,
    current,
    selected,
    open,
    sheetOpen,
    setSheetOpen,
  }
}
