import * as React from 'react'
import { cn } from 'cn'
import * as RechartsPrimitive from 'recharts'

// shadcn chart (radix-vega), trimmed to the container: tooltip and legend content are not used yet.
// The app has one theme and no `.dark` class, so colours apply without a selector prefix.
const INITIAL_DIMENSION = { width: 320, height: 200 } as const

/** Series key → label and colour; the colour is exposed to children as `var(--color-<key>)`. */
export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colors = Object.entries(config).flatMap(([key, item]) =>
    item.color ? [`  --color-${key}: ${item.color};`] : [],
  )

  if (colors.length === 0) return null

  return <style>{`[data-chart=${id}] {\n${colors.join('\n')}\n}`}</style>
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  initialDimension?: { width: number; height: number }
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  return (
    <div
      data-slot="chart"
      data-chart={chartId}
      className={cn(
        'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden',
        className,
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  )
}

export { ChartContainer, ChartStyle }
