import { muscleLine, photoUrl, useCatalogById } from '@/entities/exercise'
import { WorkoutEntryRow } from '@/entities/workout'
import { formatMassText } from '@/shared/lib'

import { formatSet } from '../../lib/format'
import type { ExerciseRow } from '../../model/types'

export function ExerciseItem({ row }: { row: ExerciseRow }) {
  const { data: byId } = useCatalogById()
  const exercise = byId?.[row.exerciseId]
  const muscles = exercise ? muscleLine(exercise) : ''

  return (
    <WorkoutEntryRow
      name={row.name}
      photoSrc={exercise && photoUrl(exercise, 0)}
      skipped={row.state === 'skipped'}
      detail={muscles || undefined}
      progress={row.state === 'partial' ? `${row.sets.length} из ${row.planned}` : undefined}
      volume={row.volumeKg > 0 ? formatMassText(row.volumeKg) : undefined}
    >
      {row.sets.length > 0 && (
        <ol aria-label={`Подходы: ${row.name}`} className="mt-2.5 ml-15 flex flex-col tabular-nums">
          {row.sets.map((set, i) => (
            <li
              key={i}
              className="grid grid-cols-[28px_1fr_auto] items-baseline gap-2 border-t border-dashed border-border py-1.5 text-[15px] first:border-t-0"
            >
              <span className="text-[13px] text-muted-foreground">{i + 1}</span>
              <span>{formatSet(set)}</span>
              {i === row.best ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-extrabold text-on-accent uppercase">
                  лучший
                </span>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ol>
      )}
    </WorkoutEntryRow>
  )
}
