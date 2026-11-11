import * as React from 'react'
import { cn } from 'cn'

// Children hold the action, such as a reset button.
function EmptyState({
  title,
  description,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-start gap-2.5 border-t border-border py-8', className)}
      {...props}
    >
      <p className="text-xl font-extrabold tracking-[-0.02em] uppercase">{title}</p>
      {description !== undefined && (
        <p className="text-[15px] leading-[1.4] text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  )
}

export { EmptyState }
