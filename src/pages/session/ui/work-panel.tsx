import { cn } from 'cn'

import { formatClock, type SetValues } from '@/entities/session'
import type { WorkoutEntry } from '@/shared/api'
import { HoldButton, Stat, StatRow } from '@/shared/ui'

import { HOLD_CTA } from '../lib/classes'
import { setText } from '../lib/format'

const NAV_BUTTON =
  'min-h-12 rounded-md border border-border bg-surface text-sm text-muted-foreground'

interface WorkPanelProps {
  entry: WorkoutEntry
  n: number
  predicted: SetValues
  // Seconds left of a timed set; undefined for sets counted in reps.
  timedLeft: number | undefined
  // Time on the exercise; undefined when that timer is off.
  exerciseSec: number | undefined
  onBack: () => void
  onAdd: () => void
  onPostpone: () => void
  onDone: () => void
}

// The set in progress: its plan or countdown, navigation and «Подход сделан».
export function WorkPanel({
  entry,
  n,
  predicted,
  timedLeft,
  exerciseSec,
  onBack,
  onAdd,
  onPostpone,
  onDone,
}: WorkPanelProps) {
  return (
    <div className="flex min-w-0 animate-in flex-col gap-3 duration-200 fade-in-0 slide-in-from-bottom-2 min-[900px]:gap-5">
      <StatRow>
        <Stat label="Подход" value={`${n} / ${entry.plan.sets}`}>
          <div className="mt-1.5 flex max-w-[80%] gap-1.5">
            {Array.from({ length: entry.plan.sets }, (_, i) => (
              <i
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  entry.sets.some((set) => set.n === i + 1) ? 'bg-primary' : 'bg-surface-2',
                )}
              />
            ))}
          </div>
        </Stat>
        {timedLeft === undefined ? (
          <Stat label="План" value={setText(predicted)} />
        ) : (
          <Stat label="Осталось" value={formatClock(timedLeft)} />
        )}
        {exerciseSec !== undefined && <Stat label="Время" value={formatClock(exerciseSec, 2)} />}
      </StatRow>

      <div className="grid grid-cols-3 gap-2">
        <HoldButton label="← Назад" className={NAV_BUTTON} onConfirm={onBack} />
        <button type="button" className={NAV_BUTTON} onClick={onAdd}>
          + Упражнение
        </button>
        <HoldButton label="Пропустить →" className={NAV_BUTTON} onConfirm={onPostpone} />
      </div>

      <HoldButton label="Подход сделан" className={HOLD_CTA} onConfirm={onDone} />
    </div>
  )
}
