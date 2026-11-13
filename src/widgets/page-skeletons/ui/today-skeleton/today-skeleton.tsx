import type { ReactNode } from 'react'

import { Loading, Skeleton } from '@/shared/ui'

interface TodaySkeletonProps {
  // TodayPage passes its real TodayHeader; a route transition has none to pass yet.
  header?: ReactNode
}

// Mirrors TodayPage's loaded branch: the week, two set cards and the start-workout CTA.
export function TodaySkeleton({ header }: TodaySkeletonProps) {
  return (
    <Loading className="flex flex-col gap-7">
      {header ?? <Skeleton className="h-[52px] w-full" />}

      <div className="flex flex-col gap-7 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] min-[900px]:items-start min-[900px]:gap-12">
        <div className="flex min-w-0 flex-col gap-7">
          <ol className="border-t border-border">
            {[0, 1].map((i) => (
              <li key={i} className="flex flex-col gap-2 border-b border-border py-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
                <div className="grid auto-cols-fr grid-flow-col gap-3 border-y border-border py-3">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-9 w-full" />
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>

        <aside className="flex min-w-0 flex-col gap-7">
          <ul className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-[52px] w-full" />
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Loading>
  )
}
