import type { SetValues } from '@/entities/session'
import type { WorkoutEntry } from '@/shared/api'
import { formatDuration } from '@/shared/lib'
import { HoldButton } from '@/shared/ui'

import { setText } from '../../lib/format'
import { ValueStrips } from '../value-strips'

interface RestPanelProps {
  entry: WorkoutEntry
  n: number
  logged: SetValues
  last: SetValues | undefined
  // Undefined when the rest timer is off: the screen stays, without a countdown.
  remainingSec: number | undefined
  weightStepKg: number
  // Stable across renders, so the strips skip the countdown's re-render each second.
  onEdit: (values: SetValues) => void
  onNext: () => void
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
  return (
    <div className="flex min-w-0 animate-in flex-col gap-3.5 duration-200 fade-in-0 slide-in-from-bottom-2">
      <div className="py-2 text-center">
        <p className="text-sm text-muted-foreground">Отдых после подхода {n}</p>
        {remainingSec !== undefined && (
          <p
            data-testid="rest-countdown"
            className="text-[84px] leading-none font-extrabold text-primary tabular-nums min-[900px]:text-[120px]"
          >
            {formatDuration(remainingSec)}
          </p>
        )}
        {last && (
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            В прошлый раз: {setText(last, true)}
          </p>
        )}
      </div>

      <ValueStrips
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

      <HoldButton variant="cta" label="Следующий подход" onConfirm={onNext} />
    </div>
  )
}
