import { Skeleton } from '@/shared/ui'

// Mirrors templates-section.tsx's list and TemplateRow's grid: 3 rows, same height and columns.
export function TemplateRowsSkeleton() {
  return (
    <ul className="border-t border-border">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-border py-3.5 min-[900px]:grid-cols-[minmax(0,1fr)_70px_110px_90px_330px] min-[900px]:items-center min-[900px]:gap-x-5 min-[900px]:py-3"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="col-start-2 row-start-1 h-5 w-14 justify-self-end rounded-full min-[900px]:row-span-2 min-[900px]:justify-self-start" />
          <Skeleton className="col-start-1 h-4 w-48 min-[900px]:row-start-2" />
          <Skeleton className="hidden h-4 w-6 min-[900px]:col-start-3 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:block" />
          <Skeleton className="hidden h-4 w-16 min-[900px]:col-start-4 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:block" />
          <Skeleton className="col-span-full mt-2 h-11 w-full rounded-lg min-[900px]:col-span-1 min-[900px]:col-start-5 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:mt-0" />
        </li>
      ))}
    </ul>
  )
}
