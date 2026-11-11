import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import type { Equipment } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import {
  selectActive,
  selectFinishing,
  toSessionEntries,
  useSessionStore,
} from '@/entities/session'
import type { Place, TemplateRef } from '@/entities/template'
import { useWorkoutHistory } from '@/entities/workout'
import type { AuthUser, WithId, Workout } from '@/shared/api'
import { unlockAudio } from '@/shared/lib'
import { Button, Sheet, SheetContent } from '@/shared/ui'

import {
  counterpartOf,
  dayPlan,
  nextPlanned,
  variantFor,
  weekdays,
  weekView,
} from '../model/schedule'
import { DaySheet } from './day-sheet'
import { SetList } from './set-list'
import { capitalize, cta, ghost, mass, refKey, useSets, weekdayName, type SetInfo } from './sets'
import { TodaySets } from './today-sets'
import { WeekBlock } from './week'

const NO_EQUIPMENT: Equipment[] = []
const NO_WORKOUTS: WithId<Workout>[] = []

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const label = 'mb-1.5 text-[13px] text-muted-foreground'
const title2 =
  'text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[34px]'

// home.html: today's sets in order, the week, the last workout and the weekday editor.
export function TodayPage({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  // shortcut: four weeks back are enough for "last workout"; a person away longer sees none.
  const range = useMemo(() => {
    const monday = addDays(now, -((now.getDay() + 6) % 7))
    return { from: addDays(monday, -28), to: addDays(monday, 7) }
  }, [now])

  const { profile, update } = useProfile(user.uid)
  const sets = useSets(user.uid, profile?.homeEquipment ?? NO_EQUIPMENT)
  const workouts = useWorkoutHistory(user.uid, range) ?? NO_WORKOUTS

  const active = useSessionStore(selectActive)
  const finishing = useSessionStore(selectFinishing)
  const running = useSessionStore((s) => s.workout?.template.name)

  const [mode, setMode] = useState<Place | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [other, setOther] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)

  const header = (paired: boolean, place: Place) => (
    <header className="flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[13px] text-muted-foreground">
          {capitalize(
            now.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }),
          )}
        </p>
        <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[40px]">
          Сегодня
        </h1>
      </div>
      {paired && (
        <div
          role="group"
          aria-label="Где тренируетесь"
          className="flex gap-[3px] rounded-lg border border-border bg-surface p-[3px]"
        >
          {(['home', 'gym'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={place === p}
              onClick={() => setMode(p)}
              className="min-h-10 min-w-16 rounded-[4px] px-3 text-sm text-muted-foreground aria-pressed:bg-primary aria-pressed:font-bold aria-pressed:text-on-accent"
            >
              {p === 'home' ? 'Дома' : 'Зал'}
            </button>
          ))}
        </div>
      )}
    </header>
  )

  if (!profile || !sets.loaded)
    return (
      <>
        {header(false, 'gym')}
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </>
    )

  // A ref to an own set deleted elsewhere is skipped; the next edit of that day drops it for good.
  const schedule = Object.fromEntries(
    weekdays.map((day) => [day, profile.schedule[day].filter((ref) => sets.find(ref))]),
  ) as typeof profile.schedule
  const plan = dayPlan(schedule, workouts, now, sets.ready)
  const week = weekView(schedule, workouts, now, sets.ready)

  const pairedRef = plan.sets.find((s) => counterpartOf(s.ref, sets.ready))?.ref
  const place = mode ?? sets.ready.find((t) => t.id === pairedRef?.id)?.place ?? 'gym'

  const items = plan.sets.map((s) => {
    const ref = s.done ? s.ref : variantFor(s.ref, place, sets.ready)
    const swapped = refKey(ref) !== refKey(s.ref)

    return {
      set: sets.find(ref),
      doneAt: s.workout && (s.workout.endedAt ?? s.workout.startedAt).toDate(),
      workoutId: s.workout?.id,
      swappedTo: swapped ? (place === 'home' ? 'дома' : 'зала') : undefined,
    }
  })
  const doneCount = plan.sets.filter((s) => s.done).length
  const next = plan.sets.length === 0 ? nextPlanned(schedule, now) : null
  const planEmpty = weekdays.every((day) => schedule[day].length === 0)
  const last = workouts.at(0)

  // A running workout is never replaced silently: the person continues or finishes it first.
  const start = (set: SetInfo) => {
    setOther(false)

    if (active) {
      setWaiting(true)
      return
    }

    // In the tap itself: the first signal of the session would be silent otherwise (research R5).
    unlockAudio()
    useSessionStore
      .getState()
      .start({ ...set.ref, name: set.name }, toSessionEntries(set.entries, sets.byId))
    void navigate('/session')
  }

  const editDay = (refs: TemplateRef[]) => {
    if (editing === null) return

    if (week.days[editing].today) setOpen(null)
    update({ schedule: { ...schedule, [weekdays[editing]]: refs } })
  }

  const planned = new Set(items.flatMap(({ set }) => (set ? [refKey(set.ref)] : [])))

  return (
    <>
      {header(pairedRef !== undefined, place)}

      <div className="flex flex-col gap-7 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] min-[900px]:items-start min-[900px]:gap-12">
        <div className="flex min-w-0 flex-col gap-7">
          {(active || finishing) && (
            <section aria-labelledby="running-title" className="flex flex-col gap-3.5">
              <div>
                <p className={label}>
                  {active ? 'Идёт тренировка' : 'Тренировка закончена, осталось сохранить'}
                </p>
                <h2 id="running-title" className={title2}>
                  {running}
                </h2>
              </div>
              <Button asChild className={cta}>
                <Link to={active ? '/session' : '/session/finish'}>
                  {active ? 'Продолжить тренировку' : 'К итогам тренировки'}
                </Link>
              </Button>
            </section>
          )}

          {plan.sets.length === 0 ? (
            <section aria-labelledby="rest-title" className="flex flex-col gap-3.5">
              <div>
                <p className={label}>По расписанию · {weekdayName(now)}</p>
                <h2 id="rest-title" className={title2}>
                  {planEmpty ? 'План пуст' : 'День отдыха'}
                </h2>
              </div>
              <p className="text-[15px] leading-[1.45] text-muted-foreground">
                {planEmpty
                  ? 'В плане на неделю нет ни одного набора. Добавьте наборы в дни недели — они будут повторяться каждую неделю.'
                  : 'На сегодня тренировка не запланирована. Мышцы растут, пока вы отдыхаете.'}
              </p>
              {planEmpty && (
                <Button
                  className={cta}
                  onClick={() => setEditing(week.days.findIndex((day) => day.today))}
                >
                  Добавить наборы в план
                </Button>
              )}
              {next && (
                <p className="text-[15px] leading-[1.45]">
                  Следующая по плану — {weekdayName(next.date)}:{' '}
                  {next.refs.map((ref) => sets.find(ref)?.name ?? 'Набор удалён').join(', ')}
                </p>
              )}
              <Button variant="outline" className={ghost} onClick={() => setOther(true)}>
                Другая тренировка
              </Button>
            </section>
          ) : (
            <section aria-labelledby="today-kicker" className="flex flex-col gap-3.5">
              <p id="today-kicker" className="text-[13px] text-muted-foreground">
                По расписанию · {weekdayName(now)} · сделано {doneCount} из {plan.sets.length}
              </p>
              <TodaySets
                items={items}
                open={open ?? plan.current}
                byId={sets.byId}
                onOpen={setOpen}
                onStart={start}
                onOther={() => setOther(true)}
              />
              {plan.state === 'done' && (
                <>
                  <p className="text-[15px] leading-[1.45] text-muted-foreground">
                    Все наборы на сегодня сделаны. Отдыхайте или выберите ещё одну тренировку.
                  </p>
                  <Button variant="outline" className={ghost} onClick={() => setOther(true)}>
                    Другая тренировка
                  </Button>
                </>
              )}
            </section>
          )}
        </div>

        {/* On desktop the week stays in place while the sets on the left scroll. */}
        <aside className="flex min-w-0 flex-col gap-7 min-[900px]:sticky min-[900px]:top-7 min-[900px]:max-h-[calc(100dvh-56px)] min-[900px]:overflow-y-auto">
          {last?.summary && (
            <section aria-labelledby="last-title">
              <p id="last-title" className={label}>
                Последняя тренировка · {last.template.name}
              </p>
              <dl className="grid grid-cols-3 border-y border-border">
                {[
                  [
                    'Дата',
                    last.startedAt.toDate().getDate(),
                    last.startedAt.toDate().toLocaleDateString('ru', { month: 'short' }),
                  ],
                  ['Длительность', Math.round(last.summary.durationSec / 60), 'мин'],
                  // A bodyweight-only workout has no volume to show.
                  last.summary.volumeKg > 0
                    ? ['Объём', mass(last.summary.volumeKg).value, mass(last.summary.volumeKg).unit]
                    : ['Объём', '—', ''],
                ].map(([name, value, unit]) => (
                  <div key={name} className="min-w-0 py-3">
                    <dt className="mb-0.5 text-xs text-muted-foreground">{name}</dt>
                    <dd className="text-[22px] font-bold tabular-nums">
                      {value}
                      <span className="ml-[3px] text-[15px] font-semibold text-muted-foreground">
                        {unit}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <WeekBlock week={week} find={sets.find} onOpenDay={setEditing} />
        </aside>
      </div>

      <Sheet open={other} onOpenChange={setOther}>
        <SheetContent title="Другая тренировка" description="Расписание не изменится">
          <SetList
            hold
            sets={sets.all}
            byId={sets.byId}
            onPick={start}
            mark={(set) => (planned.has(refKey(set.ref)) ? { text: 'По плану' } : null)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={waiting} onOpenChange={setWaiting}>
        <SheetContent
          title="Уже идёт тренировка"
          description={`Сначала продолжите или завершите «${running ?? ''}».`}
        >
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
        </SheetContent>
      </Sheet>

      <DaySheet
        date={editing === null ? null : week.days[editing].date}
        refs={editing === null ? [] : schedule[weekdays[editing]]}
        sets={sets.all}
        find={sets.find}
        byId={sets.byId}
        onChange={editDay}
        onStart={(set) => {
          setEditing(null)
          start(set)
        }}
        onClose={() => setEditing(null)}
      />
    </>
  )
}
