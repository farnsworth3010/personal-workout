import { useState, type ReactNode } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from 'recharts'

import { cn } from '@/shared/lib'
import { ChartContainer, type ChartConfig } from '@/shared/ui'

import { dayShort, monthShort } from '../../model/format'

export interface ChartPoint {
  date: Date
  value: number
}

export interface ChartSeries {
  label: string
  tone: 'primary' | 'foreground'
  points: ChartPoint[]
  dots?: boolean
}

export interface LineChartProps {
  /** Accessible name of the chart. */
  label: string
  /** Left side of the header; the right side is the readout. */
  caption?: ReactNode
  series: ChartSeries[]
  from: Date
  to: Date
  format: (value: number) => string
  unit?: string
  /** Fixed y axis [low, high, step]; otherwise derived from the data. */
  yDomain?: [number, number, number]
  className?: string
}

const toneColor = { primary: 'var(--primary)', foreground: 'var(--foreground)' }

type Row = { t: number } & Partial<Record<string, number>>

// A round step that gives about three intervals.
function niceStep(span: number) {
  const raw = span / 3
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

function yAxis(values: number[]): [number, number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = niceStep(max - min || 1)
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  return [lo, hi === lo ? hi + step : hi, step]
}

// One row per date across all series, so each line can skip dates it has no value for.
function rowsOf(series: ChartSeries[]) {
  const rows = new Map<number, Row>()
  series.forEach((s, i) => {
    for (const p of s.points) {
      const t = p.date.getTime()
      const row = rows.get(t) ?? { t }
      row[`s${i}`] = p.value
      rows.set(t, row)
    }
  })
  return [...rows.values()].sort((a, b) => a.t - b.t)
}

export function LineChart({
  label,
  caption,
  series,
  from,
  to,
  format,
  unit = '',
  yDomain,
  className,
}: LineChartProps) {
  const [active, setActive] = useState<number | null>(null)

  const rows = rowsOf(series)
  const [lo, hi, step] = yDomain ?? yAxis(series.flatMap((s) => s.points.map((p) => p.value)))
  const yTicks: number[] = []
  for (let v = lo; v <= hi + 1e-9; v += step) yTicks.push(v)

  const monthTicks: number[] = []
  for (
    let d = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    d <= to;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    monthTicks.push(d.getTime())
  }

  const config: ChartConfig = Object.fromEntries(
    series.map((s, i) => [`s${i}`, { label: s.label, color: toneColor[s.tone] }]),
  )
  const lastIndex = series.map((_, i) => rows.findLastIndex((r) => r[`s${i}`] !== undefined))
  const lasts = series.map((s) => s.points.at(-1)?.value ?? 0)
  // With two lines, the higher end label moves up and the other down so they do not overlap.
  const labelDy = (i: number) => {
    if (series.length < 2) return 0

    const mine = lasts[i] ?? 0
    return lasts.every((v, j) => j === i || mine > v || (mine === v && i < j)) ? -6 : 6
  }

  const activeRow = active === null ? undefined : rows[active]
  const readout = activeRow ? (
    <>
      {dayShort(new Date(activeRow.t))}:{' '}
      {series.map((s, i) => {
        const v = activeRow[`s${i}`]
        return (
          <span key={s.label}>
            {i > 0 && ' / '}
            <b className="font-semibold text-foreground">
              {v === undefined ? '—' : `${format(v)}${unit}`}
            </b>
          </span>
        )
      })}
    </>
  ) : series.length === 1 && rows.length > 0 ? (
    <>
      последнее:{' '}
      <b className="font-semibold text-foreground">
        {format(lasts[0] ?? 0)}
        {unit}
      </b>
    </>
  ) : null

  return (
    <div className={cn('relative min-w-0', className)}>
      <div className="flex min-h-[22px] items-baseline justify-between gap-3 text-[13px] text-muted-foreground">
        {caption}
        <span aria-live="polite" className="tabular-nums">
          {readout}
        </span>
      </div>
      <ChartContainer
        config={config}
        role="img"
        aria-label={label}
        className="aspect-auto h-[190px] w-full touch-pan-y min-[900px]:h-[220px]"
      >
        <RechartsLineChart
          data={rows}
          margin={{ top: 10, right: 44, bottom: 0, left: 0 }}
          onMouseMove={(state) => {
            const index = Number(state.activeTooltipIndex)
            setActive(Number.isInteger(index) ? index : null)
          }}
          onMouseLeave={() => setActive(null)}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[from.getTime(), Math.max(to.getTime(), from.getTime() + 1)]}
            ticks={monthTicks}
            tickFormatter={(t: number) => monthShort(new Date(t))}
            tick={{ fontSize: 11, textAnchor: 'start', dx: 4, fill: 'var(--muted-foreground)' }}
            stroke="var(--border)"
            tickSize={4}
          />
          <YAxis
            domain={[lo, hi]}
            ticks={yTicks}
            tickFormatter={format}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            width={40}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            content={() => null}
            cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          {series.map((s, i) => {
            const color = `var(--color-s${i})`
            const dot = ({ cx, cy, index }: DotItemDotProps) => {
              const last = index === lastIndex[i]
              if (cx === undefined || cy === undefined || (!last && !s.dots))
                return <g key={index} />

              return (
                <g key={index}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={last ? 4.5 : 3}
                    fill={color}
                    stroke={last ? 'none' : 'var(--background)'}
                    strokeWidth={1.5}
                  />
                  {last && (
                    <text
                      x={cx + 8}
                      y={cy + labelDy(i) + 4}
                      fill={color}
                      className="text-xs font-bold tabular-nums"
                    >
                      {format(lasts[i] ?? 0)}
                    </text>
                  )}
                </g>
              )
            }

            return (
              <Line
                key={s.label}
                dataKey={`s${i}`}
                type="linear"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                connectNulls
                dot={dot}
                activeDot={{ r: 5, fill: color, stroke: 'var(--background)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )
          })}
        </RechartsLineChart>
      </ChartContainer>
    </div>
  )
}
