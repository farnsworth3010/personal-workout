import type { Workout } from '@/shared/api'
import { formatDuration, formatMass } from '@/shared/lib'
import { Stat, StatRow } from '@/shared/ui'

export function LastWorkout({ workout }: { workout: Workout | undefined }) {
  if (!workout?.summary) return null

  const { summary } = workout
  const date = workout.startedAt.toDate()
  // A bodyweight-only workout has no volume to show.
  const volume = summary.volumeKg > 0 ? formatMass(summary.volumeKg) : { value: '—', unit: '' }

  return (
    <section aria-labelledby="last-title">
      <p id="last-title" className="mb-1.5 text-[13px] text-muted-foreground">
        Последняя тренировка · {workout.template.name}
      </p>
      <StatRow>
        <Stat
          size="sm"
          label="Дата"
          value={date.getDate()}
          unit={date.toLocaleDateString('ru', { month: 'short' })}
        />
        <Stat size="sm" label="Длительность" value={formatDuration(summary.durationSec)} />
        <Stat size="sm" label="Объём" value={volume.value} unit={volume.unit} />
      </StatRow>
    </section>
  )
}
