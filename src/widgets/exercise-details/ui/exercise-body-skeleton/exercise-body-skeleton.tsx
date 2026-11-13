import { Skeleton } from '@/shared/ui'

// Mirrors ExerciseBody: the photo, the muscle/equipment lines and the instruction steps.
export function ExerciseBodySkeleton() {
  return (
    <>
      <Skeleton className="order-first mb-1.5 aspect-[3/2] max-h-[45dvh] w-full shrink-0 rounded-lg min-[900px]:max-h-80" />
      <Skeleton className="h-[20px] w-10/12" />
      <Skeleton className="h-[20px] w-8/12" />
      <ol className="mt-1.5 flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[1.4]">
        {Array.from({ length: 4 }, (_, n) => (
          <li key={n}>
            <Skeleton className="h-[21px] w-full" />
          </li>
        ))}
      </ol>
    </>
  )
}
