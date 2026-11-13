import { Loading, Skeleton } from '@/shared/ui'

// Whole-page fallback for the /session route: the top bar, the exercise photo and the work panel.
export function SessionSkeleton() {
  return (
    <Loading className="flex min-h-[calc(100dvh-2.25rem)] min-w-0 flex-col gap-3 min-[900px]:min-h-[calc(100dvh-4.25rem)] min-[900px]:gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Skeleton className="h-11 w-24 justify-self-start rounded-md" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-10 justify-self-end" />
      </div>
      <Skeleton className="h-1 w-full rounded-full" />

      <div className="flex min-w-0 flex-1 flex-col gap-3 min-[900px]:flex-row min-[900px]:gap-8">
        <Skeleton className="min-h-[200px] flex-1 rounded-md min-[900px]:flex-[1.2]" />
        <div className="flex min-w-0 flex-col gap-3 min-[900px]:flex-1 min-[900px]:justify-center min-[900px]:gap-5">
          <Skeleton className="h-[30px] w-2/3" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </Loading>
  )
}
