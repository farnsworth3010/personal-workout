import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
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

const statValueVariants = cva('font-bold tabular-nums', {
  variants: {
    size: {
      default: 'text-[26px]',
      sm: 'text-[22px]',
    },
  },
  defaultVariants: { size: 'default' },
})

function Stat({
  label,
  value,
  unit,
  size,
  children,
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof statValueVariants> & {
    label: React.ReactNode
    value: React.ReactNode
    // Smaller and muted after the value: "из 8", "кг", "мин".
    unit?: React.ReactNode
  }) {
  return (
    <div data-slot="stat" className={cn('min-w-0 py-3', className)} {...props}>
      <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
      <p className={statValueVariants({ size })}>
        {value}
        {unit !== undefined && unit !== '' && (
          <span className="text-[15px] font-semibold text-muted-foreground"> {unit}</span>
        )}
      </p>
      {children}
    </div>
  )
}

export { Stat, StatRow }
