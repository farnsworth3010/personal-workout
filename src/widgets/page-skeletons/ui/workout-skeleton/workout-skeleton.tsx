import { useLocation, useNavigate } from 'react-router'

import { Loading, Skeleton, StatRow } from '@/shared/ui'

export function WorkoutSkeleton() {
  const navigate = useNavigate()
  const location = useLocation()

  // Opened from a link inside the app it goes back; opened directly it goes to statistics.
  const back = () => {
    if (location.key === 'default') void navigate('/stats')
    else void navigate(-1)
  }

  return (
    <Loading className="flex min-w-0 flex-col gap-6">
      <header>
        <button
          type="button"
          className="inline-flex min-h-11 items-center text-[15px] text-muted-foreground"
          onClick={back}
        >
          ‹ Назад
        </button>
        <Skeleton className="mt-1 h-[32px] w-2/3" />
      </header>

      <div className="flex min-w-0 flex-col gap-5">
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
            <li key={i} className="border-t border-border py-3 last:border-b">
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
    </Loading>
  )
}
