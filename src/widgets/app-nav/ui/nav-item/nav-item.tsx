import { Link, NavLink } from 'react-router'

import type { IconShape } from '../../model/types'

export function NavItem({
  to,
  label,
  icon,
  current,
}: {
  to: string
  label: string
  icon: IconShape[]
  // Marks the item as the current page where NavLink would not.
  current: boolean
}) {
  const className =
    'relative flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] leading-[normal] text-muted-foreground no-underline before:absolute before:inset-x-0 before:-top-px before:hidden before:h-0.5 before:bg-primary focus-ring aria-[current=page]:text-foreground aria-[current=page]:before:block min-[900px]:h-11 min-[900px]:w-full min-[900px]:shrink-0 min-[900px]:flex-row min-[900px]:justify-start min-[900px]:gap-3 min-[900px]:px-6 min-[900px]:text-[15px] min-[900px]:before:inset-y-0 min-[900px]:before:right-auto min-[900px]:before:h-auto min-[900px]:before:w-0.5'
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
        {icon.map((shape) =>
          'd' in shape ? (
            <path key={shape.d} d={shape.d} />
          ) : (
            <circle key="circle" cx={shape.cx} cy={shape.cy} r={shape.r} />
          ),
        )}
      </svg>
      <span>{label}</span>
    </>
  )

  return current ? (
    <Link to={to} aria-current="page" className={className}>
      {content}
    </Link>
  ) : (
    <NavLink to={to} end={to === '/'} className={className}>
      {content}
    </NavLink>
  )
}
