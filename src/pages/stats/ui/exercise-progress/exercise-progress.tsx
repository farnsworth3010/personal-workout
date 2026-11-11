import { useState } from 'react'

import type { Workout } from '@/shared/api'
import { Chip } from '@/shared/ui'

import { dayShort, n1 } from '../../model/format'
import { exerciseProgress, exercisesWithHistory, type ProgressPoint } from '../../model/progress'
import { LineChart } from '../line-chart'
import { Section, subheading } from '../section'

type Metric = 'weight' | 'volume' | 'reps'

const metrics: Record<
  Metric,
  { label: string; caption: string; unit: string; get: (p: ProgressPoint) => number }
> = {
  weight: {
    label: 'Вес',
    caption: 'Рабочий вес в лучшем подходе',
    unit: ' кг',
    get: (p) => p.topWeightKg,
  },
  volume: { label: 'Объём', caption: 'Объём за тренировку', unit: '', get: (p) => p.volumeKg },
  reps: { label: 'Повторы', caption: 'Повторов за тренировку', unit: '', get: (p) => p.reps },
}

// Tonnes keep the axis labels short; the unit is part of the value here.
const formatVolume = (v: number) => (v >= 1000 ? `${n1(v / 1000)} т` : `${Math.round(v)} кг`)

function Record({ label, value, date }: { label: string; value: string | null; date?: Date }) {
  return (
    <div className="min-w-0 py-3 pr-2">
      <small className="mb-0.5 block text-xs text-muted-foreground">{label}</small>
      <b className="text-xl font-bold tabular-nums">{value ?? '—'}</b>
      {date && <span className="mt-0.5 block text-xs text-muted-foreground">{dayShort(date)}</span>}
    </div>
  )
}

export function ExerciseProgress({
  workouts,
  from,
  now,
  className,
}: {
  workouts: readonly Workout[]
  from: Date
  now: Date
  className?: string
}) {
  const options = exercisesWithHistory(workouts)
  const [chosen, setChosen] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('weight')

  const exerciseId = chosen ?? options.at(0)?.exerciseId

  if (exerciseId === undefined) {
    return (
      <Section id="h-progress" title="Прогресс по упражнению" className={className}>
        <p className="text-[15px] leading-[1.4] text-muted-foreground">
          После тренировок с подходами на повторы здесь появятся график веса, объёма и повторов по
          выбранному упражнению и личные рекорды.
        </p>
      </Section>
    )
  }

  const { points, records } = exerciseProgress(workouts, exerciseId)
  const hasWeight = records.maxWeightKg !== null
  const shown = hasWeight ? metric : 'reps'
  const m = metrics[shown]

  return (
    <Section id="h-progress" title="Прогресс по упражнению" className={className}>
      <div className="relative after:pointer-events-none after:absolute after:top-1/2 after:right-3.5 after:-translate-y-1/2 after:text-muted-foreground after:content-['▾']">
        <select
          aria-label="Упражнение"
          value={exerciseId}
          className="min-h-12 w-full appearance-none rounded-lg border border-border bg-surface pr-10 pl-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(e) => setChosen(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.exerciseId} value={o.exerciseId}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div role="group" aria-label="Показатель" className="grid grid-cols-3 gap-1.5">
        {(Object.keys(metrics) as Metric[]).map((key) => (
          <Chip
            key={key}
            pressed={shown === key}
            disabled={!hasWeight && key !== 'reps'}
            className="w-full"
            onPressedChange={() => setMetric(key)}
          >
            {metrics[key].label}
          </Chip>
        ))}
      </div>

      <LineChart
        label={`График: ${m.caption.toLowerCase()}`}
        caption={<span>{m.caption}</span>}
        series={[
          {
            label: m.label,
            tone: 'primary',
            dots: true,
            points: points.map((p) => ({ date: p.date, value: m.get(p) })),
          },
        ]}
        from={from}
        to={now}
        format={shown === 'volume' ? formatVolume : n1}
        unit={m.unit}
      />

      <h3 className={subheading}>Личные рекорды</h3>
      <div className="grid grid-cols-3 border-y border-border">
        <Record
          label="Макс. вес"
          value={records.maxWeightKg && `${n1(records.maxWeightKg.value)} кг`}
          date={records.maxWeightKg?.date}
        />
        <Record
          label="Макс. объём"
          value={records.maxVolumeKg && `${n1(records.maxVolumeKg.value)} кг`}
          date={records.maxVolumeKg?.date}
        />
        <Record
          label="Лучший подход"
          value={
            records.bestSet &&
            `${records.bestSet.value.reps} × ${n1(records.bestSet.value.weightKg)}`
          }
          date={records.bestSet?.date}
        />
      </div>
    </Section>
  )
}
