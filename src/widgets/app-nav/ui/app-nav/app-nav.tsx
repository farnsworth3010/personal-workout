import { Link, useMatch } from 'react-router'

import { destinations } from '../../config/destinations'
import { NavItem } from '../nav-item'

// Bottom bar on phones, left sidebar from 900px; data-app-nav lifts toasts above it.
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
        className="hidden px-6 pb-7 text-lg leading-[1.1] font-extrabold tracking-[-0.02em] text-foreground no-underline focus-ring min-[900px]:block"
      >
        {/* Two fixed lines on every route, whatever the font. */}
        <span className="block whitespace-nowrap">PERSONAL</span>
        <span className="block whitespace-nowrap">WORKOUT</span>
      </Link>
      {destinations.map(({ to, label, icon }) => (
        // NavLink sets aria-current only on /stats itself; a finished workout belongs to statistics.
        <NavItem
          key={to}
          to={to}
          label={label}
          icon={icon}
          current={to === '/stats' && onWorkout}
        />
      ))}
    </nav>
  )
}
