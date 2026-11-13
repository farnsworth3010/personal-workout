import { memo } from 'react'

import type { SetValues } from '@/entities/session'
import type { WorkoutEntry } from '@/shared/api'

import { LabelledStrip } from '../labelled-strip'

interface ValueStripsProps extends SetValues {
  kind: WorkoutEntry['kind']
  weightStepKg: number
  onEdit: (values: SetValues) => void
}

// Primitive props only: a 0.5 kg step makes ~600 weight chips, too many to redraw every second.
export const ValueStrips = memo(function ValueStrips({
  kind,
  durationSec,
  reps,
  weightKg,
  weightStepKg,
  onEdit,
}: ValueStripsProps) {
  return (
    <>
      {kind === 'timed' && (
        <LabelledStrip
          label="Время, с"
          value={durationSec ?? 0}
          max={600}
          step={5}
          integer
          onChange={(durationSec) => onEdit({ durationSec })}
        />
      )}

      {kind === 'cardio' && (
        <LabelledStrip
          label="Время, мин"
          value={(durationSec ?? 0) / 60}
          max={120}
          step={1}
          onChange={(min) => onEdit({ durationSec: Math.round(min * 60) })}
        />
      )}

      {(kind === 'strength' || kind === 'bodyweight') && (
        <LabelledStrip
          label="Повторы"
          value={reps ?? 0}
          max={200}
          step={1}
          integer
          onChange={(reps) => onEdit({ reps })}
        />
      )}

      {kind === 'strength' && (
        <LabelledStrip
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
