import { Loading, Skeleton, StatRow } from '@/shared/ui'

// Whole-page fallback for the /session/finish route: the summary, the exercise list and the survey.
export function FinishSkeleton() {
  return (
    <Loading className="flex flex-col gap-6 pt-2 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-x-16">
      <div className="flex min-w-0 flex-col gap-5">
        <header>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-1 h-9 w-2/3" />
          <Skeleton className="mt-1.5 h-4 w-1/2" />
        </header>

        <StatRow>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="min-w-0 py-3">
              <Skeleton className="mb-0.5 h-3 w-16" />
              <Skeleton className="h-[26px] w-10" />
            </div>
          ))}
        </StatRow>

        <ul>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="border-t border-border py-2.5 last:border-b">
              <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3">
                <Skeleton className="size-12 rounded-lg" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Skeleton className="h-7 w-1/3" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
        <Skeleton className="min-h-16 w-full rounded-lg" />
      </div>
    </Loading>
  )
}
