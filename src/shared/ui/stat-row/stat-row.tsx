import * as React from 'react'
import { cn } from 'cn'

// The "Подход / План / Время" row of the workout card: equal columns between thin rules.
function StatRow({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="stat-row"
      className={cn('grid auto-cols-fr grid-flow-col border-y border-border', className)}
      {...props}
    />
  )
}

function Stat({
  label,
  value,
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div data-slot="stat" className={cn('min-w-0 py-3', className)} {...props}>
      <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
      <p className="text-[26px] font-bold tabular-nums">{value}</p>
      {children}
    </div>
  )
}

export { Stat, StatRow }
