import { photoUrl, useCatalogById } from '@/entities/exercise'
import { volumeKg, WorkoutEntryRow } from '@/entities/workout'
import type { WorkoutEntry } from '@/shared/api'
import { formatMassText } from '@/shared/lib'
import { Heading } from '@/shared/ui'

import { setsLine } from '../../lib/format'

// Every exercise of the workout with its sets and volume, or as skipped.
export function EntryResults({ entries }: { entries: readonly WorkoutEntry[] }) {
  const { data: byId } = useCatalogById()

  return (
    <section aria-labelledby="h-entries">
      <Heading id="h-entries" className="mb-2.5">
        Упражнения
      </Heading>
      <ul>
        {entries.map((entry) => {
          const line = setsLine(entry)
          const exercise = byId?.[entry.exerciseId]
          const volume = volumeKg([entry])

          return (
            <WorkoutEntryRow
              key={entry.id}
              className="py-2.5"
              name={entry.name}
              photoSrc={exercise && photoUrl(exercise, 0)}
              skipped={!line}
              detail={line ?? 'не выполнено'}
              volume={volume > 0 && formatMassText(volume)}
            />
          )
        })}
      </ul>
    </section>
  )
}
