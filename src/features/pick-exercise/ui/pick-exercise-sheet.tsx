import { useRef, useState, type RefObject } from 'react'

import {
  isGymOnly,
  muscleLabels,
  photoUrl,
  useCatalog,
  type Equipment,
  type Exercise,
} from '@/entities/exercise'
import { Badge, ExercisePhoto, Sheet, SheetContent } from '@/shared/ui'

import { searchExercises } from '../lib/search'

interface PickExerciseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (exerciseId: string) => void
  homeEquipment: readonly Equipment[]
  disabledIds?: readonly string[]
  title?: string
}

const muscles = (exercise: Exercise) =>
  exercise.primaryMuscles.map((m) => muscleLabels[m].toLocaleLowerCase('ru')).join(', ')

// template-edit.html's catalog search: a fixed height so the list does not jump while it filters.
export function PickExerciseSheet({
  open,
  onOpenChange,
  onPick,
  homeEquipment,
  disabledIds = [],
  title = 'Добавить упражнение',
}: PickExerciseSheetProps) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={title}
        className="h-[85dvh] overflow-hidden min-[900px]:h-[80vh] min-[900px]:max-w-[560px]"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          input.current?.focus()
        }}
      >
        <Results
          input={input}
          onPick={onPick}
          homeEquipment={homeEquipment}
          disabledIds={disabledIds}
        />
      </SheetContent>
    </Sheet>
  )
}

// Mounted only while the sheet is open, so the query starts empty each time.
function Results({
  input,
  onPick,
  homeEquipment,
  disabledIds,
}: Pick<PickExerciseSheetProps, 'onPick' | 'homeEquipment'> & {
  input: RefObject<HTMLInputElement | null>
  disabledIds: readonly string[]
}) {
  const [query, setQuery] = useState('')
  const { data: catalog } = useCatalog()
  const found = catalog ? searchExercises(catalog, query) : []

  return (
    <>
      {/* No negative-margin bleed: it widens the scrolling sheet body and adds a horizontal scrollbar. */}
      <label className="border-b border-border pb-3">
        <span className="sr-only">Поиск по каталогу</span>
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Жим, присед, планка…"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-lg border border-border bg-background px-3.5 text-[17px] outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </label>

      <ul className="-mt-3 flex-1 overflow-x-hidden overflow-y-auto" aria-label="Упражнения">
        {!catalog && <li className="py-6 text-[15px] text-muted-foreground">Загрузка…</li>}
        {catalog && found.length === 0 && (
          <li className="py-6 text-[15px] text-muted-foreground">
            Ничего не найдено по запросу «{query}».
          </li>
        )}
        {found.map((exercise) => {
          const added = disabledIds.includes(exercise.id)

          return (
            <li
              key={exercise.id}
              className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2"
            >
              <ExercisePhoto
                src={photoUrl(exercise, 0)}
                alt=""
                loading="lazy"
                className="size-12 rounded-lg bg-surface-2 object-cover"
              />
              <div className="min-w-0">
                <b className="block text-[15px] font-semibold wrap-break-word">
                  {exercise.name}
                  {isGymOnly(exercise, homeEquipment) && (
                    <Badge className="ml-1.5 align-[1px]">зал</Badge>
                  )}
                </b>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  {muscles(exercise)}
                </span>
              </div>
              <button
                type="button"
                disabled={added}
                aria-label={
                  added ? `Уже добавлено: ${exercise.name}` : `Добавить «${exercise.name}»`
                }
                onClick={() => onPick(exercise.id)}
                className="min-h-11 min-w-11 rounded-lg bg-primary px-3 text-[15px] font-bold text-on-accent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:cursor-default disabled:border disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
              >
                {added ? '✓' : '+'}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
