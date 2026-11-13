import { Skeleton } from '@/shared/ui'

import { CATALOG_ROWS } from '../../config/row-counts'

// Mirrors `CatalogList` + `ExerciseRow` while the catalog query is pending (3.2); the caller wraps
// it in `Loading`, so it can also sit inside `ExercisesSkeleton`'s single status region.
export function CatalogListSkeleton() {
  return (
    <>
      <p className="text-[13px] text-muted-foreground">
        <Skeleton className="inline-block h-4 w-32" />
      </p>
      <ul className="border-t border-border">
        {Array.from({ length: CATALOG_ROWS }, (_, index) => (
          <li
            key={index}
            className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 border-b border-border py-2.5"
          >
            <Skeleton className="size-16 rounded-lg" />
            <div className="min-w-0">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-1 h-4 w-1/2" />
              <Skeleton className="mt-1 h-4 w-2/5" />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
