import type { RefObject } from 'react'

import {
  CatalogFilters,
  isGymOnly,
  muscleGroupsText,
  photoUrl,
  type Equipment,
} from '@/entities/exercise'
import { Badge, Button, ExercisePhoto, Loading, Skeleton } from '@/shared/ui'

import { usePickResults } from '../../model/use-pick-results'

// Mounted only while the sheet is open, so the query and the filters start empty each time.
export function PickResults({
  input,
  onPick,
  onDetails,
  homeEquipment,
  counts,
}: {
  input: RefObject<HTMLInputElement | null>
  onPick: (exerciseId: string) => void
  onDetails?: (exerciseId: string) => void
  homeEquipment: readonly Equipment[]
  counts: Readonly<Record<string, number>>
}) {
  const { query, setQuery, choice, update, loaded, found, rows, hasMore, showMore } =
    usePickResults(homeEquipment)

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <label>
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
        <CatalogFilters
          value={choice}
          onChange={update}
          allMuscles="Все мышцы"
          anyEquipment="Любое оборудование"
        />
      </div>

      <ul className="-mt-3 flex-1 overflow-x-hidden overflow-y-auto" aria-label="Упражнения">
        {!loaded && (
          <li>
            <Loading>
              {Array.from({ length: 6 }, (_, n) => (
                <div
                  key={n}
                  className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2"
                >
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <Skeleton className="h-[18px] w-9/12" />
                    <Skeleton className="h-4 w-7/12" />
                  </div>
                </div>
              ))}
            </Loading>
          </li>
        )}
        {loaded && found.length === 0 && (
          <li className="py-6 text-[15px] text-muted-foreground">
            {query
              ? `Ничего не найдено по запросу «${query}».`
              : 'Ничего не найдено с этими фильтрами.'}
          </li>
        )}
        {rows.map((exercise) => {
          const added = counts[exercise.id] ?? 0

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
                  {added > 0 && (
                    <Badge className="ml-1.5 align-[1px] text-primary">
                      в наборе{added > 1 ? ` ×${String(added)}` : ''}
                    </Badge>
                  )}
                </b>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  {muscleGroupsText(exercise.primaryMuscles)}
                </span>
              </div>
              <span className="flex gap-1.5">
                {onDetails && (
                  <button
                    type="button"
                    aria-label={`Описание «${exercise.name}»`}
                    onClick={() => onDetails(exercise.id)}
                    className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border text-[15px] font-bold text-muted-foreground focus-ring hover:text-foreground"
                  >
                    i
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Добавить «${exercise.name}»`}
                  onClick={() => onPick(exercise.id)}
                  className="min-h-11 min-w-11 rounded-lg bg-primary px-3 text-[15px] font-bold text-on-accent focus-ring"
                >
                  +
                </button>
              </span>
            </li>
          )
        })}
        {hasMore && (
          <li className="py-3">
            <Button variant="outline" className="min-h-11 rounded-lg px-4" onClick={showMore}>
              Показать ещё
            </Button>
          </li>
        )}
      </ul>
    </>
  )
}
