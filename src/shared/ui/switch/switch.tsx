import * as React from 'react'
import { cn } from 'cn'
import { Switch as SwitchPrimitive } from 'radix-ui'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border border-border bg-surface-2 p-[3px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6 rounded-full bg-muted-foreground transition-[translate,background-color] duration-200 data-checked:translate-x-5 data-checked:bg-on-accent"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
