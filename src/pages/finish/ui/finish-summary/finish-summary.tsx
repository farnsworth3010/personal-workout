import { volumeKg } from '@/entities/workout'
import type { Workout } from '@/shared/api'
import { formatDuration, formatMass, longDate } from '@/shared/lib'
import { Stat, StatRow, Title } from '@/shared/ui'

// The heading of the finish screen and the workout's time, exercises and volume.
export function FinishSummary({ workout }: { workout: Workout }) {
  const { entries } = workout
  const durationSec = Math.round(
    ((workout.endedAt ?? workout.updatedAt).toMillis() - workout.startedAt.toMillis()) / 1000,
  )
  const done = entries.filter((e) => e.status === 'done').length
  const total = formatMass(volumeKg(entries))

  return (
    <>
      <header>
        <p className="text-[13px] font-bold tracking-[0.04em] text-primary uppercase">
          Тренировка завершена
        </p>
        <Title className="mt-1 text-[30px] leading-[1.05] min-[900px]:text-5xl">
          Отличная работа
        </Title>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {workout.template.name} · {longDate(workout.startedAt.toDate())}
        </p>
      </header>

      <StatRow>
        <Stat label="Время" value={formatDuration(durationSec)} />
        <Stat label="Упражнения" value={done} unit={`из ${entries.length}`} />
        <Stat label="Объём" value={total.value} unit={total.unit} />
      </StatRow>
    </>
  )
}
