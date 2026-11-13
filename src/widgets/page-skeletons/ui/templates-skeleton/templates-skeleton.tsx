import { Loading, PageHeader, Skeleton } from '@/shared/ui'

import { TemplateRowsSkeleton } from '../template-rows-skeleton'

// Whole-page fallback for the /templates route, shown before TemplatesPage's module has loaded.
export function TemplatesSkeleton() {
  return (
    <Loading className="flex flex-col gap-7">
      {/* PageHeader's subtitle renders inside a <p>; a Skeleton <div> can't nest there. */}
      <div>
        <PageHeader title="Наборы" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-[18px] w-28" />
        <TemplateRowsSkeleton />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-[18px] w-36" />
        <TemplateRowsSkeleton />
      </div>
    </Loading>
  )
}
