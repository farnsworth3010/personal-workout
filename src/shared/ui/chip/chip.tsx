import * as React from 'react'
import { cn } from 'cn'
import { Toggle as TogglePrimitive } from 'radix-ui'

// A pressable filter or value chip; Radix Toggle sets aria-pressed.
function Chip({ className, ...props }: React.ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      data-slot="chip"
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface px-3.5 text-[15px] font-semibold whitespace-nowrap text-foreground outline-none select-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-accent',
        className,
      )}
      {...props}
    />
  )
}

export { Chip }
