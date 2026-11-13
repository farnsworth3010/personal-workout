import type { ListedTemplate, Place } from '@/entities/template'
import type { Profile } from '@/shared/api'
import { Heading, Loading, Skeleton } from '@/shared/ui'
import { TemplateRowsSkeleton } from '@/widgets/page-skeletons'

import { TemplateRow } from '../template-row'

interface TemplatesSectionProps {
  id: string
  title: string
  sets: ListedTemplate[] | undefined
  empty: string
  error: unknown
  filter: Place | null
  catalogLoaded: boolean
  schedule: Profile['schedule'] | undefined
  copiedIds: ReadonlySet<string | null>
  onView: (set: ListedTemplate) => void
  onStart: (set: ListedTemplate) => void
  onCopy: (set: ListedTemplate) => void
}

export function TemplatesSection({
  id,
  title,
  sets,
  empty,
  error,
  filter,
  catalogLoaded,
  schedule,
  copiedIds,
  onView,
  onStart,
  onCopy,
}: TemplatesSectionProps) {
  const shown = sets?.filter((s) => !filter || s.place === filter)
  const loaded = sets && shown && catalogLoaded

  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2.5">
      <Heading id={id} className="flex items-baseline gap-2">
        {title}
        {loaded ? (
          <small className="text-sm font-semibold tracking-normal text-muted-foreground tabular-nums">
            {shown.length === sets.length ? sets.length : `${shown.length} из ${sets.length}`}
          </small>
        ) : (
          !error && <Skeleton className="inline-block h-4 w-6" />
        )}
      </Heading>

      {error ? (
        <p className="border-y border-border py-4 text-[15px] text-muted-foreground">
          Не удалось загрузить наборы.
        </p>
      ) : !loaded ? (
        <Loading>
          <TemplateRowsSkeleton />
        </Loading>
      ) : shown.length === 0 ? (
        <p className="border-y border-border py-4 text-[15px] text-muted-foreground">{empty}</p>
      ) : (
        <>
          <div
            aria-hidden
            className="hidden pb-1.5 text-xs text-muted-foreground min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_70px_110px_90px_330px] min-[900px]:gap-x-5"
          >
            <span>Набор и мышцы</span>
            <span>Где</span>
            <span>Упражнений</span>
            <span>Время</span>
            <span />
          </div>
          <ul className="border-t border-border">
            {shown.map((set) => (
              <TemplateRow
                key={set.ref.id}
                set={set}
                schedule={schedule}
                copied={copiedIds.has(set.ref.id)}
                onView={onView}
                onStart={onStart}
                onCopy={onCopy}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
