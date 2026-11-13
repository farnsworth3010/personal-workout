import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { useCatalogById } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import { toSessionEntries } from '@/entities/session'
import {
  copyTemplate,
  useOwnTemplates,
  useTemplateList,
  type ListedTemplate,
  type Place,
} from '@/entities/template'
import { RunningWorkoutSheet, useStartWorkout } from '@/features/start-workout'
import type { AuthUser } from '@/shared/api'
import { ScrollTop, toast } from '@/shared/ui'

import { noEquipment } from '../../config/empty'
import { placeFilters } from '../../config/places'
import { setSummary } from '../../lib/format'
import { SetSheet } from '../set-sheet'
import { TemplatesSection } from '../templates-section'
import { TemplatesToolbar } from '../templates-toolbar'

// templates.html: own and ready-made sets with a place filter; start, edit or copy each.
export function TemplatesPage({ user }: { user: AuthUser }) {
  const [params, setParams] = useSearchParams()
  const startWorkout = useStartWorkout()
  const [viewed, setViewed] = useState<ListedTemplate | null>(null)

  const { profile } = useProfile(user.uid)
  const { data: catalog } = useCatalogById()
  const homeEquipment = profile?.homeEquipment ?? noEquipment
  const { own, ready, ownError, readyError } = useTemplateList(user.uid, catalog, homeEquipment)
  // The documents, for copiedFrom; the same cached query useTemplateList reads.
  const { data: ownTemplates } = useOwnTemplates(user.uid)
  const byId = catalog ?? {}
  const filter = placeFilters.find((f) => f.place === params.get('place'))?.place ?? null

  const setFilter = (place: Place | null) =>
    setParams(place ? { place } : {}, { replace: true, preventScrollReset: true })

  const start = ({ ref, name, entries }: ListedTemplate) =>
    startWorkout.start({ ...ref, name }, toSessionEntries(entries, byId))

  const copy = (set: ListedTemplate) => {
    copyTemplate(user.uid, { id: set.ref.id, name: set.name, entries: set.entries })
    toast(`«${set.name}» теперь в ваших наборах`)
  }

  const copiedIds = new Set(ownTemplates?.map((t) => t.copiedFrom))

  const where = filter ? { home: ' для дома', gym: ' для зала' }[filter] : ''

  return (
    <>
      <TemplatesToolbar filter={filter} onFilter={setFilter} />

      <TemplatesSection
        id="mine-title"
        title="Мои наборы"
        sets={own}
        empty={`У вас пока нет наборов${where}. Скопируйте готовый или создайте свой.`}
        error={ownError}
        filter={filter}
        catalogLoaded={catalog !== undefined}
        schedule={profile?.schedule}
        copiedIds={copiedIds}
        onView={setViewed}
        onStart={start}
        onCopy={copy}
      />
      <TemplatesSection
        id="ready-title"
        title="Готовые наборы"
        sets={ready}
        empty={`Готовых наборов${where} нет.`}
        error={readyError}
        filter={filter}
        catalogLoaded={catalog !== undefined}
        schedule={profile?.schedule}
        copiedIds={copiedIds}
        onView={setViewed}
        onStart={start}
        onCopy={copy}
      />

      <ScrollTop />

      <SetSheet
        set={viewed}
        summary={viewed ? setSummary(viewed, byId) : ''}
        homeEquipment={homeEquipment}
        copied={viewed !== null && copiedIds.has(viewed.ref.id)}
        onClose={() => setViewed(null)}
        onStart={(set) => {
          setViewed(null)
          start(set)
        }}
        onCopy={copy}
      />
      <RunningWorkoutSheet open={startWorkout.blocked} onOpenChange={startWorkout.setBlocked} />
    </>
  )
}
