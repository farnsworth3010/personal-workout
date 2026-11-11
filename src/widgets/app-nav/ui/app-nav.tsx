import type { ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router'

// Icon paths from ../personal-workout-design/home.html.
const destinations: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/',
    label: 'Сегодня',
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    to: '/templates',
    label: 'Наборы',
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  },
  {
    to: '/exercises',
    label: 'Упражнения',
    icon: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
  },
  { to: '/stats', label: 'Статистика', icon: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" /> },
  {
    to: '/settings',
    label: 'Профиль',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
]

// Bottom bar on phones, left sidebar from 900px; data-app-nav lifts toasts above it.
const itemClass =
  'relative flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] leading-[normal] text-muted-foreground no-underline outline-none before:absolute before:inset-x-0 before:-top-px before:hidden before:h-0.5 before:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid aria-[current=page]:text-foreground aria-[current=page]:before:block min-[900px]:h-11 min-[900px]:w-full min-[900px]:shrink-0 min-[900px]:flex-row min-[900px]:justify-start min-[900px]:gap-3 min-[900px]:px-6 min-[900px]:text-[15px] min-[900px]:before:inset-y-0 min-[900px]:before:right-auto min-[900px]:before:h-auto min-[900px]:before:w-0.5'

export function AppNav() {
  const onWorkout = useMatch('/workouts/:id') !== null

  return (
    <nav
      data-app-nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-10 grid h-[calc(56px+env(safe-area-inset-bottom))] grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] min-[900px]:top-0 min-[900px]:right-auto min-[900px]:flex min-[900px]:h-auto min-[900px]:w-[220px] min-[900px]:shrink-0 min-[900px]:flex-col min-[900px]:border-t-0 min-[900px]:border-r min-[900px]:py-7"
    >
      <Link
        to="/"
        aria-label="Personal Workout — на главную"
        className="hidden px-6 pb-7 text-lg leading-[1.1] font-extrabold tracking-[-0.02em] text-foreground no-underline outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid min-[900px]:block"
      >
        {/* Two fixed lines on every route, whatever the font. */}
        <span className="block whitespace-nowrap">PERSONAL</span>
        <span className="block whitespace-nowrap">WORKOUT</span>
      </Link>
      {destinations.map(({ to, label, icon }) => {
        const content = (
          <>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="flex-none"
            >
              {icon}
            </svg>
            <span>{label}</span>
          </>
        )

        // NavLink sets aria-current only on /stats itself; a finished workout belongs to statistics.
        return to === '/stats' && onWorkout ? (
          <Link key={to} to={to} aria-current="page" className={itemClass}>
            {content}
          </Link>
        ) : (
          <NavLink key={to} to={to} end={to === '/'} className={itemClass}>
            {content}
          </NavLink>
        )
      })}
    </nav>
  )
}
