import { findExercise, photoUrl, useCatalog } from '@/entities/exercise'
import type { WorkoutEntry } from '@/shared/api'
import { Sheet, SheetContent } from '@/shared/ui'

interface PostponedSheetProps {
  entries: readonly WorkoutEntry[]
  // At the end of the queue the list asks for a decision and cannot be dismissed.
  ending: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onResume: (entryId: string) => void
  onFinish: () => void
}

export function PostponedSheet({
  entries,
  ending,
  open,
  onOpenChange,
  onResume,
  onFinish,
}: PostponedSheetProps) {
  const { data: catalog } = useCatalog()

  const photo = (id: string) => {
    const exercise = catalog && findExercise(catalog, id)

    return exercise && photoUrl(exercise, 0)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={ending ? 'Остались отложенные упражнения' : 'Отложенные упражнения'}
        description={
          ending
            ? 'Вернитесь к ним сейчас или завершите тренировку без них.'
            : 'Вернитесь к упражнению, когда тренажёр освободится.'
        }
        dismissible={!ending}
      >
        <ul className="mt-2">
          {entries.map((entry) =>
            entry.status === 'postponed' ? (
              <li key={entry.id} className="flex items-center gap-3 border-t border-border py-2.5">
                <img
                  src={photo(entry.exerciseId)}
                  alt=""
                  className="size-14 flex-none rounded-md bg-surface-2 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <b className="block text-[15px] leading-tight">{entry.name}</b>
                  <small className="text-[13px] text-muted-foreground tabular-nums">
                    сделано подходов: {entry.sets.length} из {entry.plan.sets}
                  </small>
                </div>
                <button
                  type="button"
                  className="min-h-11 flex-none rounded-md bg-primary px-3.5 text-sm font-bold text-on-accent"
                  onClick={() => onResume(entry.id)}
                >
                  Вернуться
                </button>
              </li>
            ) : null,
          )}
        </ul>
        {ending && (
          <button
            type="button"
            className="mt-2 min-h-12 rounded-md border border-border text-[15px]"
            onClick={onFinish}
          >
            Завершить без них
          </button>
        )}
      </SheetContent>
    </Sheet>
  )
}
