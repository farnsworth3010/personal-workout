import { formatClock, type SetValues } from '@/entities/session'
import type { WorkoutEntry } from '@/shared/api'
import { HoldButton, ValueStrip } from '@/shared/ui'

import { setText } from '../lib/format'

interface RestPanelProps {
  entry: WorkoutEntry
  n: number
  logged: SetValues
  last: SetValues | undefined
  remainingSec: number
  weightStepKg: number
  onEdit: (values: SetValues) => void
  onNext: () => void
}

function Strip(props: React.ComponentProps<typeof ValueStrip>) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] text-muted-foreground">{props.label}</p>
      <ValueStrip {...props} />
    </div>
  )
}

// Logging happens here while the countdown runs; an untouched strip keeps the prediction.
export function RestPanel({
  entry,
  n,
  logged,
  last,
  remainingSec,
  weightStepKg,
  onEdit,
  onNext,
}: RestPanelProps) {
  const { kind } = entry

  return (
    <div className="flex min-w-0 animate-in flex-col gap-3.5 duration-200 fade-in-0 slide-in-from-bottom-2">
      <div className="py-2 text-center">
        <p className="text-sm text-muted-foreground">Отдых после подхода {n}</p>
        <p
          data-testid="rest-countdown"
          className="text-[84px] leading-none font-extrabold text-primary tabular-nums min-[900px]:text-[120px]"
        >
          {formatClock(remainingSec)}
        </p>
        {last && (
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            В прошлый раз: {setText(last, true)}
          </p>
        )}
      </div>

      {kind === 'timed' && (
        <Strip
          label="Время, с"
          value={logged.durationSec ?? 0}
          max={600}
          step={5}
          integer
          onChange={(durationSec) => onEdit({ durationSec })}
        />
      )}

      {kind === 'cardio' && (
        <Strip
          label="Время, мин"
          value={(logged.durationSec ?? 0) / 60}
          max={120}
          step={1}
          onChange={(min) => onEdit({ durationSec: Math.round(min * 60) })}
        />
      )}

      {(kind === 'strength' || kind === 'bodyweight') && (
        <Strip
          label="Повторы"
          value={logged.reps ?? 0}
          max={200}
          step={1}
          integer
          onChange={(reps) => onEdit({ reps })}
        />
      )}

      {kind === 'strength' && (
        <Strip
          label="Вес, кг"
          value={logged.weightKg}
          max={300}
          step={weightStepKg}
          onChange={(weightKg) => onEdit({ weightKg })}
        />
      )}

      <p className="text-center text-xs text-muted-foreground">
        листайте, чтобы найти значение · тап по выбранному — ввести своё
      </p>

      <HoldButton
        label="Следующий подход"
        className="min-h-16 rounded-md bg-primary text-lg font-bold text-on-accent uppercase [&>span:first-child]:bg-on-accent/25"
        onConfirm={onNext}
      />
    </div>
  )
}
