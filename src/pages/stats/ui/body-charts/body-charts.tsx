import type { Workout } from '@/shared/api'

import { bodyWeightSeries, weeklySurvey } from '../../model/body'
import { addDays } from '../../model/dates'
import { n1 } from '../../model/format'
import { LineChart, type ChartPoint } from '../line-chart'
import { note, Section } from '../section'

const empty = 'text-[15px] leading-[1.4] text-muted-foreground'

export function BodyCharts({
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
  const weight = bodyWeightSeries(workouts).map((p) => ({ date: p.date, value: p.kg }))

  // A week's average sits mid-week, the current week's at today.
  const weeks = weeklySurvey(workouts)
  const at = (week: Date) => {
    const mid = addDays(week, 3)
    return mid > now ? now : mid
  }
  const series = (key: 'wellbeing' | 'energy'): ChartPoint[] =>
    weeks.flatMap((w) => {
      const value = w[key]
      return value === null ? [] : [{ date: at(w.week), value }]
    })
  const wellbeing = series('wellbeing')
  const energy = series('energy')

  return (
    <Section id="h-body" title="Тело и самочувствие" className={className}>
      <div className="flex flex-col gap-6 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-x-12">
        {weight.length === 0 ? (
          <p className={empty}>
            Вес тела появится здесь, когда вы укажете его в опросе после тренировки.
          </p>
        ) : (
          <LineChart
            label="График веса тела"
            caption={<span>Вес тела, кг</span>}
            series={[{ label: 'Вес тела', tone: 'primary', dots: true, points: weight }]}
            from={from}
            to={now}
            format={n1}
            unit=" кг"
          />
        )}

        {wellbeing.length + energy.length === 0 ? (
          <p className={empty}>
            Самочувствие и энергия появятся после ответов в опросе после тренировки.
          </p>
        ) : (
          <div>
            <LineChart
              label="График самочувствия и энергии"
              caption={
                <span className="flex gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="h-0.5 w-3.5 rounded-sm bg-primary" />
                    Самочувствие
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="h-0.5 w-3.5 rounded-sm bg-foreground" />
                    Энергия
                  </span>
                </span>
              }
              series={[
                { label: 'Самочувствие', tone: 'primary', points: wellbeing },
                { label: 'Энергия', tone: 'foreground', points: energy },
              ]}
              from={from}
              to={now}
              format={n1}
              yDomain={[1, 5, 1]}
            />
            <p className={note}>Среднее за неделю по шкале 1–5</p>
          </div>
        )}
      </div>
    </Section>
  )
}
