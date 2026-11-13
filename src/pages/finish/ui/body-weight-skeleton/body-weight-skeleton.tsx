import { Loading, Skeleton } from '@/shared/ui'

export function BodyWeightSkeleton() {
  return (
    <Loading className="flex flex-col gap-2.5">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="mx-auto h-[18px] w-40" />
    </Loading>
  )
}
