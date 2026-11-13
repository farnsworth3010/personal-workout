import { useState } from 'react'

import type { Workout } from '@/shared/api'
import { formatMassText, n1 } from '@/shared/lib'
import { Chip, Section } from '@/shared/ui'

import { metrics } from '../../config/metrics'
import { exerciseProgress, exercisesWithHistory } from '../../model/progress'
import type { Metric } from '../../model/types'
import { LineChart } from '../line-chart'
import { RecordTile } from '../record-tile'

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
        format={shown === 'volume' ? formatMassText : n1}
        unit={m.unit}
      />

      <h3 className="text-[13px] font-semibold text-muted-foreground">Личные рекорды</h3>
      <div className="grid grid-cols-3 border-y border-border">
        <RecordTile
          label="Макс. вес"
          value={records.maxWeightKg && `${n1(records.maxWeightKg.value)} кг`}
          date={records.maxWeightKg?.date}
        />
        <RecordTile
          label="Макс. объём"
          value={records.maxVolumeKg && formatMassText(records.maxVolumeKg.value)}
          date={records.maxVolumeKg?.date}
        />
        <RecordTile
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
