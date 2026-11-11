import { Outlet, useNavigation } from 'react-router'

import { cn } from '@/shared/lib'

// The splash of index.html, kept on screen while the first route module loads.
export function Splash() {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="fixed inset-0 grid place-content-center justify-items-center gap-3.5 bg-background text-center text-[22px] leading-[1.1] font-extrabold tracking-[-0.02em] text-foreground uppercase"
    >
      <span>
        Personal
        <br />
        Workout
      </span>
      <i className="h-[3px] w-12 animate-pulse rounded-sm bg-primary motion-reduce:animate-none" />
    </div>
  )
}

// A bar at the top while a lazy page loads; the delay keeps fast navigations from flashing it.
export function PendingBar() {
  const pending = useNavigation().state === 'loading'

  return (
    <>
      <Outlet />
      <div
        role="progressbar"
        aria-label="Загрузка страницы"
        aria-hidden={!pending}
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 transition-opacity max-[900px]:top-[env(safe-area-inset-top)]',
          pending ? 'opacity-100 delay-200' : 'opacity-0',
        )}
      >
        {/* The pulse animates opacity too, so it lives on an inner element. */}
        <div className="size-full animate-pulse bg-primary motion-reduce:animate-none" />
      </div>
    </>
  )
}
