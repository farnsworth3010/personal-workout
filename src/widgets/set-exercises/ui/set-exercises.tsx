import { muscleLabels, photoUrl, type Exercise } from '@/entities/exercise'
import type { TemplateEntry } from '@/entities/template'
import { cn } from '@/shared/lib'
import { ExercisePhoto } from '@/shared/ui'

const planLine = (entry: TemplateEntry) =>
  entry.durationSec === undefined
    ? `${entry.sets} × ${entry.reps ?? 0}`
    : `${entry.sets} × ${entry.durationSec} с`

const musclesOf = (exercise: Exercise | undefined) =>
  exercise?.primaryMuscles.map((m) => muscleLabels[m].toLocaleLowerCase('ru')).join(', ') ?? ''

// A set's exercises with photo, muscles, plan and rest; with onExercise each row opens its details.
export function SetExercises({
  name,
  entries,
  byId,
  onExercise,
}: {
  name: string
  entries: readonly TemplateEntry[]
  byId: Record<string, Exercise | undefined>
  onExercise?: (exerciseId: string) => void
}) {
  return (
    <ol aria-label={`Упражнения набора «${name}»`}>
      {entries.map((entry) => {
        const exercise = byId[entry.exerciseId]
        const title = exercise?.name ?? entry.exerciseId
        const row = (
          <>
            <ExercisePhoto
              src={exercise && photoUrl(exercise, 0)}
              loading="lazy"
              className="size-[52px] rounded-lg bg-surface object-cover min-[900px]:size-16"
            />
            <span className="min-w-0">
              <b className="block text-[15px] leading-[1.25] font-semibold">{title}</b>
              <small className="mt-0.5 block text-[13px] text-muted-foreground">
                {musclesOf(exercise)}
              </small>
            </span>
            <span className="text-right whitespace-nowrap tabular-nums">
              <span className="block text-[15px] font-semibold min-[900px]:text-base">
                {planLine(entry)}
              </span>
              <small className="block text-[13px] text-muted-foreground">
                отдых {entry.restSec} с
              </small>
            </span>
          </>
        )
        const grid =
          'grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 py-2.5 text-left min-[900px]:grid-cols-[64px_1fr_auto] min-[900px]:gap-4'

        return (
          <li key={entry.id} className="border-b border-border first:border-t">
            {onExercise ? (
              <button
                type="button"
                aria-label={`${title}: подробнее`}
                onClick={() => onExercise(entry.exerciseId)}
                className={cn(
                  grid,
                  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
                )}
              >
                {row}
              </button>
            ) : (
              <div className={grid}>{row}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
