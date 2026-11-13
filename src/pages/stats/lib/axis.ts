import type { ChartRow, ChartSeries } from '../model/types'

// A round step that gives about three intervals.
export function niceStep(span: number) {
  const raw = span / 3
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

export function yAxis(values: number[]): [number, number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = niceStep(max - min || 1)
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  return [lo, hi === lo ? hi + step : hi, step]
}

// One row per date across all series, so each line can skip dates it has no value for.
export function rowsOf(series: ChartSeries[]) {
  const rows = new Map<number, ChartRow>()
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
