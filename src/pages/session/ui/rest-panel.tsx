import { memo } from 'react'

import { formatClock, type SetValues } from '@/entities/session'
import type { WorkoutEntry } from '@/shared/api'
import { HoldButton, ValueStrip } from '@/shared/ui'

import { HOLD_CTA } from '../lib/classes'
import { setText } from '../lib/format'

interface RestPanelProps {
  entry: WorkoutEntry
  n: number
  logged: SetValues
  last: SetValues | undefined
  remainingSec: number
  weightStepKg: number
  // Stable across renders, so the strips skip the countdown's re-render each second.
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

interface StripsProps extends SetValues {
  kind: WorkoutEntry['kind']
  weightStepKg: number
  onEdit: (values: SetValues) => void
}

// Primitive props only: a 0.5 kg step makes ~600 weight chips, too many to redraw every second.
const Strips = memo(function Strips({
  kind,
  durationSec,
  reps,
  weightKg,
  weightStepKg,
  onEdit,
}: StripsProps) {
  return (
    <>
      {kind === 'timed' && (
        <Strip
          label="Время, с"
          value={durationSec ?? 0}
          max={600}
          step={5}
          integer
          onChange={(durationSec) => onEdit({ durationSec })}
        />
      )}

      {kind === 'cardio' && (
        <Strip
          label="Время, мин"
          value={(durationSec ?? 0) / 60}
          max={120}
          step={1}
          onChange={(min) => onEdit({ durationSec: Math.round(min * 60) })}
        />
      )}

      {(kind === 'strength' || kind === 'bodyweight') && (
        <Strip
          label="Повторы"
          value={reps ?? 0}
          max={200}
          step={1}
          integer
          onChange={(reps) => onEdit({ reps })}
        />
      )}

      {kind === 'strength' && (
        <Strip
          label="Вес, кг"
          value={weightKg}
          max={300}
          step={weightStepKg}
          onChange={(weightKg) => onEdit({ weightKg })}
        />
      )}
    </>
  )
})

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

      <Strips
        kind={entry.kind}
        durationSec={logged.durationSec}
        reps={logged.reps}
        weightKg={logged.weightKg}
        weightStepKg={weightStepKg}
        onEdit={onEdit}
      />

      <p className="text-center text-xs text-muted-foreground">
        листайте, чтобы найти значение · тап по выбранному — ввести своё
      </p>

      <HoldButton label="Следующий подход" className={HOLD_CTA} onConfirm={onNext} />
    </div>
  )
}
