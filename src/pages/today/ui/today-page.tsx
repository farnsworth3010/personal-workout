import { useMemo, useState } from 'react'
import { Link } from 'react-router'

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
import { InstallHint } from '@/features/install-app'
import { RunningWorkoutSheet, useStartWorkout } from '@/features/start-workout'
import type { AuthUser, WithId, Workout } from '@/shared/api'
import { addDays, formatMass, useToday, weekStart } from '@/shared/lib'
import { Button, Sheet, SheetContent } from '@/shared/ui'

import { weekdayName } from '../lib/format'
import { weekdays } from '../model/schedule'
import { refKey, useSets, type SetInfo } from '../model/sets'
import { todayPlan } from '../model/today-plan'
import { DaySheet } from './day-sheet'
import { RecoveredWorkout } from './recovered-workout'
import { SetList } from './set-list'
import { label, title2 } from './styles'
import { TodayHeader } from './today-header'
import { TodaySets } from './today-sets'
import { WeekBlock } from './week'

const NO_EQUIPMENT: Equipment[] = []
const NO_WORKOUTS: WithId<Workout>[] = []

// home.html: today's sets in order, the week, the last workout and the weekday editor.
export function TodayPage({ user }: { user: AuthUser }) {
  const now = useToday()
  // shortcut: four weeks back are enough for "last workout"; a person away longer sees none.
  const range = useMemo(() => {
    const monday = weekStart(now)
    return { from: addDays(monday, -28), to: addDays(monday, 7) }
  }, [now])

  const { profile, update } = useProfile(user.uid)
  const sets = useSets(user.uid, profile?.homeEquipment ?? NO_EQUIPMENT)
  const workouts = useWorkoutHistory(user.uid, range) ?? NO_WORKOUTS

  const active = useSessionStore(selectActive)
  const finishing = useSessionStore(selectFinishing)
  const running = useSessionStore((s) => s.workout?.template.name)
  const startWorkout = useStartWorkout()

  const [mode, setMode] = useState<Place | null>(null)
  const [openSetIndex, setOpenSetIndex] = useState<number | null>(null)
  const [otherSheetOpen, setOtherSheetOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<number | null>(null)

  if (!profile || !sets.loaded)
    return (
      <>
        <TodayHeader date={now} onPlace={setMode} />
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </>
    )

  const { schedule, plan, week, paired, place, items, doneCount, next, planEmpty, planned } =
    todayPlan(profile.schedule, sets, workouts, now, mode)
  const last = workouts.at(0)

  const start = (set: SetInfo) => {
    setOtherSheetOpen(false)
    startWorkout.start({ ...set.ref, name: set.name }, toSessionEntries(set.entries, sets.byId))
  }

  const editDay = (refs: TemplateRef[]) => {
    if (editingDay === null) return

    if (week.days[editingDay].today) setOpenSetIndex(null)
    update({ schedule: { ...schedule, [weekdays[editingDay]]: refs } })
  }

  return (
    <>
      <TodayHeader date={now} place={paired ? place : undefined} onPlace={setMode} />

      <div className="flex flex-col gap-7 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] min-[900px]:items-start min-[900px]:gap-12">
        <div className="flex min-w-0 flex-col gap-7">
          <InstallHint />
          <RecoveredWorkout uid={user.uid} />
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
              <Button asChild size="cta">
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
                  size="cta"
                  onClick={() => setEditingDay(week.days.findIndex((day) => day.today))}
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
              <Button variant="outline" size="ghost" onClick={() => setOtherSheetOpen(true)}>
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
                open={openSetIndex ?? plan.current}
                byId={sets.byId}
                onOpen={setOpenSetIndex}
                onStart={start}
                onOther={() => setOtherSheetOpen(true)}
              />
              {plan.state === 'done' && (
                <>
                  <p className="text-[15px] leading-[1.45] text-muted-foreground">
                    Все наборы на сегодня сделаны. Отдыхайте или выберите ещё одну тренировку.
                  </p>
                  <Button variant="outline" size="ghost" onClick={() => setOtherSheetOpen(true)}>
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
                    ? [
                        'Объём',
                        formatMass(last.summary.volumeKg).value,
                        formatMass(last.summary.volumeKg).unit,
                      ]
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

          <WeekBlock week={week} find={sets.find} onOpenDay={setEditingDay} />
        </aside>
      </div>

      <Sheet open={otherSheetOpen} onOpenChange={setOtherSheetOpen}>
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

      <RunningWorkoutSheet open={startWorkout.blocked} onOpenChange={startWorkout.setBlocked} />

      <DaySheet
        date={editingDay === null ? null : week.days[editingDay].date}
        refs={editingDay === null ? [] : schedule[weekdays[editingDay]]}
        sets={sets.all}
        find={sets.find}
        byId={sets.byId}
        onChange={editDay}
        onStart={(set) => {
          setEditingDay(null)
          start(set)
        }}
        onClose={() => setEditingDay(null)}
      />
    </>
  )
}
