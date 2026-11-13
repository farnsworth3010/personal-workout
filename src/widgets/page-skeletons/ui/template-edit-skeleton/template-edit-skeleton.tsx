import type { ReactNode } from 'react'

import { Loading, Skeleton } from '@/shared/ui'

import { ENTRY_ROWS } from '../../config/row-counts'

interface TemplateEditSkeletonProps {
  header?: ReactNode
}

// Mirrors `Editor`'s two-column grid; `header` is the real `BackLink` from the page, or a
// `BackLink`-shaped placeholder when used as a route transition fallback (3.2). The title is
// always a placeholder: a route skeleton cannot know "Редактор набора" from "Новый набор".
export function TemplateEditSkeleton({ header }: TemplateEditSkeletonProps) {
  return (
    <Loading className="flex min-w-0 flex-col gap-4">
      {header ?? <Skeleton className="h-4 w-20" />}
      <Skeleton className="h-7 w-48" />

      <div className="flex min-w-0 flex-col gap-4 min-[900px]:grid min-[900px]:grid-cols-[260px_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-10">
        <div className="flex min-w-0 flex-col gap-3.5 min-[900px]:gap-[18px]">
          <Skeleton className="min-h-13 w-full rounded-lg" />

          <div className="grid grid-cols-2 border-y border-border">
            <div className="py-2.5">
              <Skeleton className="mb-1.5 h-3 w-16" />
              <Skeleton className="h-7 w-9" />
            </div>
            <div className="py-2.5">
              <Skeleton className="mb-1.5 h-3 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>

          <Skeleton className="h-5 w-4/5" />
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          <ol className="border-t border-border">
            {Array.from({ length: ENTRY_ROWS }, (_, index) => (
              <li
                key={index}
                className="flex flex-col gap-2.5 border-b border-border py-3 min-[900px]:grid min-[900px]:grid-cols-[56px_minmax(0,1fr)_repeat(3,68px)] min-[900px]:items-center min-[900px]:gap-2.5 min-[900px]:py-2.5"
              >
                <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 min-[900px]:contents">
                  <Skeleton className="size-14 rounded-lg" />
                  <div className="min-w-0">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-1 h-4 w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 min-[900px]:contents">
                  <Skeleton className="min-h-11 rounded-lg" />
                  <Skeleton className="min-h-11 rounded-lg" />
                  <Skeleton className="min-h-11 rounded-lg" />
                </div>
              </li>
            ))}
          </ol>
          <Skeleton className="min-h-13 rounded-lg" />
        </div>
      </div>
    </Loading>
  )
}
