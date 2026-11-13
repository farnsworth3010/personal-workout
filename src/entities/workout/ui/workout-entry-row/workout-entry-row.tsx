import type { ReactNode } from 'react'

import { cn } from '@/shared/lib'
import { ExercisePhoto } from '@/shared/ui'

interface WorkoutEntryRowProps {
  name: string
  // The exercise's photo; the entity cannot read the catalog, so the parent passes it.
  photoSrc: string | undefined
  skipped: boolean
  // Under the name: the muscles or the sets line.
  detail?: ReactNode
  // Right column of a done entry, muted: the volume.
  volume?: ReactNode
  // Right column of an unfinished entry, in place of the volume: "3 из 4".
  progress?: ReactNode
  // Below the row, e.g. the list of sets.
  children?: ReactNode
  className?: string
}

// One exercise of a finished workout: photo, name, its line and the volume or a status badge.
export function WorkoutEntryRow({
  name,
  photoSrc,
  skipped,
  detail,
  volume,
  progress,
  children,
  className,
}: WorkoutEntryRowProps) {
  return (
    <li className={cn('border-t border-border py-3 last:border-b', className)}>
      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3">
        <ExercisePhoto
          src={photoSrc}
          loading="lazy"
          className={cn('size-12 rounded-lg bg-surface object-cover', skipped && 'opacity-35')}
        />
        <div className="min-w-0">
          <b
            className={cn(
              'block text-[15px] font-semibold [overflow-wrap:anywhere]',
              skipped && 'text-muted-foreground line-through',
            )}
          >
            {name}
          </b>
          {detail !== undefined && (
            <small className="text-[13px] text-muted-foreground tabular-nums">{detail}</small>
          )}
        </div>
        {skipped ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
            пропущено
          </span>
        ) : progress !== undefined ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-warn tabular-nums">
            {progress}
          </span>
        ) : (
          <span className="text-right text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
            {volume}
          </span>
        )}
      </div>
      {children}
    </li>
  )
}
