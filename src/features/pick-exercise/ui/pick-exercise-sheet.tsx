import { useRef, useState, type RefObject } from 'react'

import {
  equipmentLabels,
  equipmentList,
  filterCatalog,
  isGymOnly,
  muscleGroups,
  muscleLabels,
  photoUrl,
  useCatalog,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '@/entities/exercise'
import { Badge, Chip, ChipRow, ExercisePhoto, Sheet, SheetContent, Switch } from '@/shared/ui'

interface PickExerciseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (exerciseId: string) => void
  homeEquipment: readonly Equipment[]
  // How many times each exercise is already in the set; a set may hold one exercise twice.
  counts?: Readonly<Record<string, number>>
  // Opens the exercise's description above the sheet; the page composes it, a feature cannot.
  onDetails?: (exerciseId: string) => void
  title?: string
}

const groupList = Object.entries(muscleGroups) as [
  MuscleGroup,
  (typeof muscleGroups)[MuscleGroup],
][]

const muscles = (exercise: Exercise) =>
  exercise.primaryMuscles.map((m) => muscleLabels[m].toLocaleLowerCase('ru')).join(', ')

// template-edit.html's catalog search: a fixed height so the list does not jump while it filters.
export function PickExerciseSheet({
  open,
  onOpenChange,
  onPick,
  homeEquipment,
  counts = {},
  onDetails,
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
          onDetails={onDetails}
          homeEquipment={homeEquipment}
          counts={counts}
        />
      </SheetContent>
    </Sheet>
  )
}

// Mounted only while the sheet is open, so the query and the filters start empty each time.
function Results({
  input,
  onPick,
  onDetails,
  homeEquipment,
  counts,
}: Pick<PickExerciseSheetProps, 'onPick' | 'onDetails' | 'homeEquipment'> & {
  input: RefObject<HTMLInputElement | null>
  counts: Readonly<Record<string, number>>
}) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [homeOnly, setHomeOnly] = useState(false)
  const { data: catalog } = useCatalog()
  const found = catalog
    ? filterCatalog(
        catalog,
        { query, muscles: group && muscleGroups[group].muscles, equipment, homeOnly },
        homeEquipment,
      )
    : []

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
        <ChipRow role="group" aria-label="Мышцы">
          <Chip pressed={!group} onPressedChange={() => setGroup(null)}>
            Все мышцы
          </Chip>
          {groupList.map(([key, { label }]) => (
            <Chip key={key} pressed={group === key} onPressedChange={() => setGroup(key)}>
              {label}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow role="group" aria-label="Оборудование">
          <Chip pressed={!equipment} onPressedChange={() => setEquipment(null)}>
            Любое оборудование
          </Chip>
          {equipmentList.map((key) => (
            <Chip key={key} pressed={equipment === key} onPressedChange={() => setEquipment(key)}>
              {equipmentLabels[key]}
            </Chip>
          ))}
        </ChipRow>
        <label
          htmlFor="pick-home-only"
          className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px]"
        >
          Только для дома
          <Switch id="pick-home-only" checked={homeOnly} onCheckedChange={setHomeOnly} />
        </label>
      </div>

      <ul className="-mt-3 flex-1 overflow-x-hidden overflow-y-auto" aria-label="Упражнения">
        {!catalog && <li className="py-6 text-[15px] text-muted-foreground">Загрузка…</li>}
        {catalog && found.length === 0 && (
          <li className="py-6 text-[15px] text-muted-foreground">
            {query
              ? `Ничего не найдено по запросу «${query}».`
              : 'Ничего не найдено с этими фильтрами.'}
          </li>
        )}
        {found.map((exercise) => {
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
                  {muscles(exercise)}
                </span>
              </div>
              <span className="flex gap-1.5">
                {onDetails && (
                  <button
                    type="button"
                    aria-label={`Описание «${exercise.name}»`}
                    onClick={() => onDetails(exercise.id)}
                    className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border text-[15px] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
                  >
                    i
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Добавить «${exercise.name}»`}
                  onClick={() => onPick(exercise.id)}
                  className="min-h-11 min-w-11 rounded-lg bg-primary px-3 text-[15px] font-bold text-on-accent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
                >
                  +
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}
