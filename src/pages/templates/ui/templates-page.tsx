import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { muscleLabels, useCatalog, type Exercise } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import {
  selectActive,
  selectFinishing,
  toSessionEntries,
  useSessionStore,
} from '@/entities/session'
import {
  copyTemplate,
  estimateDurationMin,
  muscleGroupsOf,
  placeOf,
  useOwnTemplates,
  useReadyTemplates,
  type Place,
  type TemplateEntry,
  type TemplateRef,
} from '@/entities/template'
import type { AuthUser, Profile } from '@/shared/api'
import { cn } from '@/shared/lib'
import {
  Badge,
  Button,
  Chip,
  HoldButton,
  PageHeader,
  ScrollTop,
  Sheet,
  SheetContent,
  toast,
} from '@/shared/ui'

interface ListedSet {
  ref: TemplateRef
  name: string
  entries: TemplateEntry[]
}

type ById = Record<string, Exercise | undefined>

const cta = 'h-auto min-h-16 rounded-lg border-0 text-lg font-bold uppercase'
const ghost = 'h-auto min-h-12 rounded-lg bg-surface text-sm font-normal'
const action =
  'flex min-h-11 items-center justify-center rounded-lg px-[18px] text-[15px] font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid min-[900px]:px-3'
const columns = 'min-[900px]:grid-cols-[minmax(0,1fr)_70px_110px_90px_330px] min-[900px]:gap-x-5'

const FILTERS: { place: Place | null; label: string }[] = [
  { place: 'home', label: 'Дома' },
  { place: 'gym', label: 'Зал' },
  { place: null, label: 'Все' },
]

const PLACE_LABEL: Record<Place, string> = { home: 'Дом', gym: 'Зал' }

const WEEKDAYS: [keyof Profile['schedule'], string][] = [
  ['mon', 'понедельникам'],
  ['tue', 'вторникам'],
  ['wed', 'средам'],
  ['thu', 'четвергам'],
  ['fri', 'пятницам'],
  ['sat', 'субботам'],
  ['sun', 'воскресеньям'],
]

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10
  const m100 = n % 100

  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

const exercisesWord = (n: number) => `${n} ${plural(n, 'упражнение', 'упражнения', 'упражнений')}`

const musclesText = (entries: TemplateEntry[], byId: ById) =>
  muscleGroupsOf({ entries }, byId)
    .map((m, i) => (i === 0 ? muscleLabels[m] : muscleLabels[m].toLocaleLowerCase('ru')))
    .join(', ')

const daysText = (ref: TemplateRef, schedule: Profile['schedule'] | undefined) => {
  const days = WEEKDAYS.filter(([day]) =>
    schedule?.[day].some((r) => r.source === ref.source && r.id === ref.id),
  ).map(([, label]) => label)

  return days.length > 0 ? `по ${days.join(', ')}` : null
}

// templates.html: own and ready-made sets with a place filter; start, edit or copy each.
export function TemplatesPage({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const active = useSessionStore(selectActive)
  const finishing = useSessionStore(selectFinishing)
  const running = useSessionStore((s) => s.workout?.template.name)
  const [waiting, setWaiting] = useState(false)

  const { profile } = useProfile(user.uid)
  const { data: catalog } = useCatalog()
  const { data: ready, error: readyError } = useReadyTemplates()
  const { data: own, error: ownError } = useOwnTemplates(user.uid)
  const byId = useMemo(
    () => Object.fromEntries((catalog ?? []).map((e) => [e.id, e])) as ById,
    [catalog],
  )
  const homeEquipment = profile?.homeEquipment ?? []
  const filter = FILTERS.find((f) => f.place === params.get('place'))?.place ?? null

  const setFilter = (place: Place | null) =>
    setParams(place ? { place } : {}, { replace: true, preventScrollReset: true })

  // A running or unsaved workout is never replaced silently: the person continues or finishes it.
  const start = ({ ref, name, entries }: ListedSet) => {
    if (active || finishing) {
      setWaiting(true)
      return
    }

    useSessionStore.getState().start({ ...ref, name }, toSessionEntries(entries, byId))
    void navigate('/session')
  }

  const copy = (set: ListedSet) => {
    copyTemplate(user.uid, { id: set.ref.id, name: set.name, entries: set.entries })
    toast(`«${set.name}» теперь в ваших наборах`)
  }

  const copiedIds = new Set(own?.map((t) => t.copiedFrom))
  const where = filter ? { home: ' для дома', gym: ' для зала' }[filter] : ''

  const section = (
    id: string,
    title: string,
    sets: ListedSet[] | undefined,
    empty: string,
    error: unknown,
  ) => {
    const shown = sets?.filter((s) => !filter || placeOf(s, byId, homeEquipment) === filter)
    const loaded = sets && shown && catalog

    return (
      <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2.5">
        <h2
          id={id}
          className="flex items-baseline gap-2 text-lg font-extrabold tracking-[-0.02em] uppercase"
        >
          {title}
          {loaded && (
            <small className="text-sm font-semibold tracking-normal text-muted-foreground tabular-nums">
              {shown.length === sets.length ? sets.length : `${shown.length} из ${sets.length}`}
            </small>
          )}
        </h2>

        {error ? (
          <p className="border-y border-border py-4 text-[15px] text-muted-foreground">
            Не удалось загрузить наборы.
          </p>
        ) : !loaded ? (
          <p className="border-y border-border py-4 text-[15px] text-muted-foreground">Загрузка…</p>
        ) : shown.length === 0 ? (
          <p className="border-y border-border py-4 text-[15px] text-muted-foreground">{empty}</p>
        ) : (
          <>
            <div
              aria-hidden
              className={cn(
                'hidden pb-1.5 text-xs text-muted-foreground min-[900px]:grid',
                columns,
              )}
            >
              <span>Набор и мышцы</span>
              <span>Где</span>
              <span>Упражнений</span>
              <span>Время</span>
              <span />
            </div>
            <ul className="border-t border-border">
              {shown.map((set) => {
                const place = placeOf(set, byId, homeEquipment)
                const minutes = estimateDurationMin(set, byId)
                const days = daysText(set.ref, profile?.schedule)
                const copied = copiedIds.has(set.ref.id)

                return (
                  <li
                    key={set.ref.id}
                    className={cn(
                      'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-border py-3.5 min-[900px]:items-center min-[900px]:py-3',
                      columns,
                    )}
                  >
                    <span className="text-[17px] leading-tight font-bold">{set.name}</span>
                    <Badge
                      className={cn(
                        'col-start-2 row-start-1 self-start justify-self-end px-2.5 text-xs min-[900px]:row-span-2 min-[900px]:self-center min-[900px]:justify-self-start',
                        place === 'home' &&
                          'border border-border bg-transparent text-muted-foreground',
                      )}
                    >
                      {PLACE_LABEL[place]}
                    </Badge>
                    <span className="col-start-1 text-sm tabular-nums min-[900px]:hidden">
                      {exercisesWord(set.entries.length)} · ~{minutes} мин
                    </span>
                    <span className="col-start-1 text-sm text-muted-foreground min-[900px]:row-start-2">
                      {musclesText(set.entries, byId)}
                      {days && (
                        <>
                          {' · '}
                          <span className="text-primary">{days}</span>
                        </>
                      )}
                    </span>
                    <span className="hidden text-[15px] tabular-nums min-[900px]:col-start-3 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:block">
                      {set.entries.length}
                    </span>
                    <span className="hidden text-[15px] tabular-nums min-[900px]:col-start-4 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:block">
                      ~{minutes} мин
                    </span>
                    <span className="col-span-full mt-2 flex gap-2 min-[900px]:col-span-1 min-[900px]:col-start-5 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:mt-0 min-[900px]:grid min-[900px]:grid-cols-[1fr_1.6fr]">
                      <HoldButton
                        label="Начать"
                        className={cn(action, 'bg-primary text-on-accent')}
                        aria-label={`Начать «${set.name}»`}
                        onConfirm={() => start(set)}
                      />
                      {set.ref.source === 'own' ? (
                        <Link
                          to={`/templates/${set.ref.id}`}
                          className={cn(action, 'border border-border')}
                          aria-label={`Изменить «${set.name}»`}
                        >
                          Изменить
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={copied}
                          className={cn(
                            action,
                            'border border-border disabled:text-muted-foreground',
                          )}
                          aria-label={
                            copied
                              ? `«${set.name}» уже скопирован`
                              : `Скопировать «${set.name}» к себе`
                          }
                          onClick={() => copy(set)}
                        >
                          {copied ? 'Скопирован' : 'Скопировать к себе'}
                        </button>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    )
  }

  const ownSets = own?.map((t): ListedSet => ({ ...t, ref: { source: 'own', id: t.id } }))
  const readySets = ready?.map((t): ListedSet => ({ ...t, ref: { source: 'ready', id: t.id } }))

  return (
    <>
      {/* Pinned on desktop while the lists scroll; the negative margins stretch it over ScreenLayout's padding. */}
      <div className="flex flex-col gap-3.5 min-[900px]:sticky min-[900px]:top-0 min-[900px]:z-10 min-[900px]:-mx-10 min-[900px]:-mt-7 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-6 min-[900px]:bg-background min-[900px]:px-10 min-[900px]:pt-7 min-[900px]:pb-4">
        <PageHeader
          title="Наборы"
          subtitle="Шаблоны тренировок: порядок упражнений, подходы и отдых"
        />
        <div className="flex flex-col gap-3.5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-3">
          <div
            role="group"
            aria-label="Где тренироваться"
            className="grid grid-cols-3 gap-1.5 min-[900px]:w-[300px]"
          >
            {FILTERS.map(({ place, label }) => (
              <Chip key={label} pressed={filter === place} onPressedChange={() => setFilter(place)}>
                {label}
              </Chip>
            ))}
          </div>
          <Button
            asChild
            className="h-auto min-h-13 rounded-lg border-0 px-6 text-[17px] font-bold uppercase"
          >
            <Link to="/templates/new">Создать набор</Link>
          </Button>
        </div>
      </div>

      {section(
        'mine-title',
        'Мои наборы',
        ownSets,
        `У вас пока нет наборов${where}. Скопируйте готовый или создайте свой.`,
        ownError,
      )}
      {section(
        'ready-title',
        'Готовые наборы',
        readySets,
        `Готовых наборов${where} нет.`,
        readyError,
      )}

      <ScrollTop />

      <Sheet open={waiting} onOpenChange={setWaiting}>
        <SheetContent
          title={active ? 'Уже идёт тренировка' : 'Тренировка не сохранена'}
          description={
            active
              ? `Сначала продолжите или завершите «${running ?? ''}».`
              : `Сначала сохраните итоги «${running ?? ''}».`
          }
        >
          {active ? (
            <>
              <Button asChild className={cta}>
                <Link to="/session">Продолжить</Link>
              </Button>
              <Button
                variant="outline"
                className={ghost}
                onClick={() => {
                  useSessionStore.getState().end()
                  void navigate('/session/finish')
                }}
              >
                Завершить и перейти к итогам
              </Button>
            </>
          ) : (
            <Button asChild className={cta}>
              <Link to="/session/finish">К итогам тренировки</Link>
            </Button>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
