import { useDeferredValue, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import {
  equipmentLabels,
  equipmentList,
  filterCatalog,
  isGymOnly,
  kindLabels,
  muscleGroups,
  muscleLabels,
  photoUrl,
  useCatalog,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import type { AuthUser } from '@/shared/api'
import {
  Badge,
  Button,
  Chip,
  ChipRow,
  EmptyState,
  PageHeader,
  ScrollTop,
  Switch,
} from '@/shared/ui'
import { ExerciseDetails, ExerciseDetailsPanel } from '@/widgets/exercise-details'

import { readParams, writeParams, type CatalogParams } from '../model/params'

// Rows rendered per step: the whole catalog at once makes typing lag on slow phones.
const PAGE = 60
const DESKTOP = '(min-width: 900px)'

const groupList = Object.entries(muscleGroups) as [
  MuscleGroup,
  (typeof muscleGroups)[MuscleGroup],
][]
const noEquipment: Equipment[] = []

const lower = (text: string) => text.toLocaleLowerCase('ru')
const pluralRules = new Intl.PluralRules('ru')
const forms: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'упражнение', few: 'упражнения' }
const exercisesWord = (n: number) => `${n} ${forms[pluralRules.select(n)] ?? 'упражнений'}`

const homeHint = (home: readonly Equipment[]) => {
  const items = home.filter((e) => e !== 'body only').map((e) => lower(equipmentLabels[e]))
  const text = new Intl.ListFormat('ru').format([...items, 'свой вес'])

  return `${text.charAt(0).toLocaleUpperCase('ru')}${text.slice(1)} — из профиля`
}

const subscribeDesktop = (onChange: () => void) => {
  const query = matchMedia(DESKTOP)
  query.addEventListener('change', onChange)

  return () => query.removeEventListener('change', onChange)
}

const useDesktop = () =>
  useSyncExternalStore(
    subscribeDesktop,
    () => matchMedia(DESKTOP).matches,
    () => false,
  )

const muscleLine = (exercise: Exercise) =>
  [exercise.primaryMuscles, exercise.secondaryMuscles]
    .filter((group) => group.length > 0)
    .map((group) => group.map((m) => lower(muscleLabels[m])).join(', '))
    .join(' · ')

const rowClass =
  "relative grid w-full grid-cols-[64px_minmax(0,1fr)] items-center gap-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:before:absolute aria-[current=true]:before:inset-y-2.5 aria-[current=true]:before:-left-3 aria-[current=true]:before:w-0.5 aria-[current=true]:before:bg-primary aria-[current=true]:before:content-[''] min-[900px]:rounded-lg min-[900px]:px-3 min-[900px]:hover:bg-surface min-[900px]:aria-[current=true]:bg-surface min-[900px]:aria-[current=true]:before:left-0"

function ExerciseRow({
  exercise,
  gym,
  current,
  onOpen,
}: {
  exercise: Exercise
  gym: boolean
  current: boolean
  onOpen: (id: string) => void
}) {
  const photo = photoUrl(exercise, 0)

  return (
    <li className="border-b border-border">
      <button
        type="button"
        aria-current={current}
        className={rowClass}
        onClick={() => onOpen(exercise.id)}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="size-16 rounded-lg bg-surface object-cover"
          />
        ) : (
          <span aria-hidden="true" className="size-16 rounded-lg bg-surface" />
        )}
        <span className="min-w-0">
          <b className="block text-base leading-tight font-semibold">
            {exercise.name}
            {gym && <Badge className="ml-1.5 align-[1px]">зал</Badge>}
          </b>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {muscleLine(exercise)}
          </span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {equipmentLabels[exercise.equipment ?? 'body only']} · {kindLabels[exercise.kind]}
          </span>
        </span>
      </button>
    </li>
  )
}

function FilterGroup({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <small id={id} className="mb-1.5 block text-[13px] text-muted-foreground">
        {label}
      </small>
      <ChipRow role="group" aria-labelledby={id}>
        {children}
      </ChipRow>
    </div>
  )
}

const addToSet = (
  <div className="mt-2.5 flex flex-col gap-1.5">
    <Button disabled className="min-h-14 rounded-lg text-[17px] font-bold uppercase">
      Добавить в набор
    </Button>
    <p className="text-[13px] text-muted-foreground">
      Добавление в наборы появится вместе с редактором наборов.
    </p>
  </div>
)

// exercises.html: search and filters live in the URL; details open in a sheet or a side panel.
export function ExercisesPage({ user }: { user: AuthUser }) {
  const catalog = useCatalog()
  const homeEquipment = useProfile(user.uid).profile?.homeEquipment ?? noEquipment
  const desktop = useDesktop()

  const [searchParams, setSearchParams] = useSearchParams()
  const params = readParams(searchParams)
  // Local state keeps the input in step with the keyboard; the URL follows it.
  const [query, setQuery] = useState(params.q)
  const deferredQuery = useDeferredValue(query)

  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const update = (patch: Partial<CatalogParams>) => {
    setSearchParams((prev) => writeParams({ ...readParams(prev), ...patch }), { replace: true })
  }

  const reset = () => {
    setQuery('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const { muscle, equipment, home } = params
  const visible = useMemo(
    () =>
      catalog.data
        ? filterCatalog(
            catalog.data,
            {
              query: deferredQuery,
              muscles: muscle && muscleGroups[muscle].muscles,
              equipment,
              homeOnly: home,
            },
            homeEquipment,
          )
        : [],
    [catalog.data, deferredQuery, muscle, equipment, home, homeEquipment],
  )

  // The shown count resets whenever the filter changes.
  const filterKey = `${deferredQuery}|${muscle}|${equipment}|${home}`
  const [shown, setShown] = useState({ key: filterKey, count: PAGE })
  const count = shown.key === filterKey ? shown.count : PAGE

  // The desktop panel always shows an exercise from the current list.
  const panelId = visible.some((e) => e.id === selected) ? selected : (visible[0]?.id ?? null)
  const current = desktop ? panelId : selected

  const open = (id: string) => {
    setSelected(id)
    if (!desktop) setSheetOpen(true)
  }

  const total = catalog.data?.length ?? 0
  const emptyText = [
    deferredQuery && `по запросу «${deferredQuery}»`,
    muscle && `в группе «${muscleGroups[muscle].label}»`,
    equipment && `с оборудованием «${equipmentLabels[equipment]}»`,
    home && 'для дома',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <PageHeader
        title="Упражнения"
        subtitle={catalog.data && `Каталог · ${exercisesWord(total)}`}
        className="tabular-nums"
      />

      <div className="min-w-0 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-[900px]:items-start min-[900px]:gap-10">
        <section aria-label="Каталог" className="flex min-w-0 flex-col gap-3.5">
          <label>
            <span className="sr-only">Поиск по каталогу</span>
            <input
              type="search"
              value={query}
              placeholder="Название, мышца, оборудование"
              autoComplete="off"
              enterKeyHint="search"
              className="min-h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-[17px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              onChange={(event) => {
                setQuery(event.target.value)
                update({ q: event.target.value })
              }}
            />
          </label>

          <FilterGroup id="muscles-label" label="Мышцы">
            <Chip pressed={!muscle} onPressedChange={() => update({ muscle: null })}>
              Все
            </Chip>
            {groupList.map(([key, group]) => (
              <Chip
                key={key}
                pressed={muscle === key}
                onPressedChange={() => update({ muscle: key })}
              >
                {group.label}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup id="equipment-label" label="Оборудование">
            <Chip pressed={!equipment} onPressedChange={() => update({ equipment: null })}>
              Все
            </Chip>
            {equipmentList.map((key) => (
              <Chip
                key={key}
                pressed={equipment === key}
                onPressedChange={() => update({ equipment: key })}
              >
                {equipmentLabels[key]}
              </Chip>
            ))}
          </FilterGroup>

          <label
            htmlFor="home-only"
            className="flex min-h-14 cursor-pointer items-center justify-between gap-3 border-y border-border py-1.5"
          >
            <span>
              <b className="block text-base font-semibold">Только для дома</b>
              <small className="mt-0.5 block text-[13px] text-muted-foreground">
                {homeHint(homeEquipment)}
              </small>
            </span>
            <Switch
              id="home-only"
              checked={home}
              onCheckedChange={(checked) => update({ home: checked })}
            />
          </label>

          {catalog.isPending && <p className="text-sm text-muted-foreground">Загрузка каталога…</p>}

          {catalog.isError && (
            <EmptyState
              title="Каталог не загрузился"
              description="Проверьте соединение и попробуйте ещё раз."
            >
              <Button
                variant="outline"
                className="min-h-11 rounded-lg px-4"
                onClick={() => void catalog.refetch()}
              >
                Повторить
              </Button>
            </EmptyState>
          )}

          {catalog.data && visible.length > 0 && (
            <>
              <p aria-live="polite" className="text-[13px] text-muted-foreground tabular-nums">
                {visible.length === total
                  ? `Показаны все ${exercisesWord(total)}`
                  : `Найдено: ${exercisesWord(visible.length)}`}
              </p>
              <ul className="border-t border-border">
                {visible.slice(0, count).map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    gym={isGymOnly(exercise, homeEquipment)}
                    current={exercise.id === current}
                    onOpen={open}
                  />
                ))}
              </ul>
              {visible.length > count && (
                <Button
                  variant="outline"
                  className="min-h-11 self-start rounded-lg px-4"
                  onClick={() => setShown({ key: filterKey, count: count + PAGE })}
                >
                  Показать ещё
                </Button>
              )}
            </>
          )}

          {catalog.data && visible.length === 0 && (
            <EmptyState
              title="Ничего не найдено"
              description={`Нет упражнений ${emptyText}. Проверьте написание или ослабьте фильтры.`}
            >
              <Button variant="outline" className="min-h-11 rounded-lg px-4" onClick={reset}>
                Сбросить поиск и фильтры
              </Button>
            </EmptyState>
          )}
        </section>

        {desktop && (
          <div className="sticky top-8 max-h-[calc(100dvh-64px)] overflow-y-auto">
            {panelId ? (
              <ExerciseDetailsPanel exerciseId={panelId} homeEquipment={homeEquipment}>
                {addToSet}
              </ExerciseDetailsPanel>
            ) : (
              catalog.data && (
                <p className="rounded-lg border border-border bg-surface p-6 text-[13px] text-muted-foreground">
                  Выберите упражнение в списке, чтобы увидеть технику.
                </p>
              )
            )}
          </div>
        )}
      </div>

      <ScrollTop />

      {!desktop && selected && (
        <ExerciseDetails
          exerciseId={selected}
          homeEquipment={homeEquipment}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        >
          {addToSet}
        </ExerciseDetails>
      )}
    </>
  )
}
