import { formatDuration } from '@/shared/lib'
import { HoldButton } from '@/shared/ui'

interface SessionTopBarProps {
  // Undefined when the workout clock is off.
  workoutSec: number | undefined
  position: number
  total: number
  onEnd: () => void
}

// «Завершить», the workout clock, the position in the queue and the progress bar.
export function SessionTopBar({ workoutSec, position, total, onEnd }: SessionTopBarProps) {
  return (
    <>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-muted-foreground">
        <HoldButton
          label="Завершить"
          className="min-h-11 justify-self-start rounded-md border border-border px-3.5 text-sm text-foreground"
          onConfirm={onEnd}
        />
        <span className="text-base font-semibold text-foreground tabular-nums">
          {workoutSec !== undefined && formatDuration(workoutSec, 2)}
        </span>
        <span className="justify-self-end tabular-nums">
          {position} / {total}
        </span>
      </div>

      {/* The «3 / 8» counter above says the same to a screen reader. */}
      <div aria-hidden className="h-1 overflow-hidden rounded-full bg-surface-2">
        <i className="block h-full bg-primary" style={{ width: `${(position / total) * 100}%` }} />
      </div>
    </>
  )
}
