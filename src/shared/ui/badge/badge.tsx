import * as React from 'react'
import { cn } from 'cn'

// The "зал" mark on gym-only exercises.
function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center rounded-full bg-warn px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-on-accent uppercase not-italic',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
