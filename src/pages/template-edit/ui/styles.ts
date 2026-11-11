import { cn } from '@/shared/lib'

export const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid'

export const iconButton = cn(
  'grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent',
  focusRing,
)

export const input =
  'w-full rounded-lg border border-border bg-surface outline-none focus:border-primary aria-invalid:border-warn'
