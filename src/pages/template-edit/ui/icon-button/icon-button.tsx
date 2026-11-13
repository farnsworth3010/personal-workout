import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib'

// The 44px square row controls: move up, move down, remove.
export function IconButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'grid size-11 place-items-center rounded-lg text-muted-foreground focus-ring hover:bg-surface hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}
