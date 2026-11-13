import { Loading, PageHeader, Skeleton } from '@/shared/ui'

import { CatalogListSkeleton } from '../catalog-list-skeleton'

// Whole-page fallback for the /exercises route while its module loads (3.2); mirrors `ExercisesPage`.
export function ExercisesSkeleton() {
  return (
    <Loading>
      <PageHeader title="Упражнения" subtitle={<Skeleton className="inline-block h-4 w-40" />} />

      <div className="min-w-0 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-[900px]:items-start min-[900px]:gap-10">
        <section aria-label="Каталог" className="flex min-w-0 flex-col gap-3.5">
          <Skeleton className="min-h-12 rounded-lg" />

          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>

          <CatalogListSkeleton />
        </section>

        <div className="hidden min-[900px]:block">
          <Skeleton className="sticky top-8 h-[480px] rounded-lg" />
        </div>
      </div>
    </Loading>
  )
}
