import { useMemo, useState } from 'react'

import { useCatalogById } from '@/entities/exercise'
import { useProfile, weekdays } from '@/entities/profile'
import { toSessionEntries } from '@/entities/session'
import { useTemplateList, type ListedTemplate, type TemplateRef } from '@/entities/template'
import { useWorkoutHistory } from '@/entities/workout'
import { InstallHint } from '@/features/install-app'
import { RunningWorkoutSheet, useStartWorkout } from '@/features/start-workout'
import type { AuthUser } from '@/shared/api'
import { addDays, useToday, weekStart } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { TodaySkeleton } from '@/widgets/page-skeletons'

import { noEquipment, noWorkouts } from '../../config/empty'
import { weekdayName } from '../../lib/format'
import { choosePlace, usePlaceStore } from '../../model/place'
import { todayPlan } from '../../model/today-plan'
import { DaySheet } from '../day-sheet'
import { LastWorkout } from '../last-workout'
import { OtherWorkoutSheet } from '../other-workout-sheet'
import { RecoveredWorkout } from '../recovered-workout'
import { RestDay } from '../rest-day'
import { RunningWorkoutCard } from '../running-workout-card'
import { TodayHeader } from '../today-header'
import { TodaySets } from '../today-sets'
import { WeekBlock } from '../week-block'

// home.html: today's sets in order, the week, the last workout and the weekday editor.
export function TodayPage({ user }: { user: AuthUser }) {
  const now = useToday()
  // shortcut: four weeks back are enough for "last workout"; a person away longer sees none.
  const range = useMemo(() => {
    const monday = weekStart(now)
    return { from: addDays(monday, -28), to: addDays(monday, 7) }
  }, [now])

  const { profile, update } = useProfile(user.uid)
  const { data: byId } = useCatalogById()
  const sets = useTemplateList(user.uid, byId, profile?.homeEquipment ?? noEquipment)
  const workouts = useWorkoutHistory(user.uid, range) ?? noWorkouts

  const startWorkout = useStartWorkout()

  const chosenPlace = usePlaceStore((s) => s.place)
  const [openSetIndex, setOpenSetIndex] = useState<number | null>(null)
  const [otherSheetOpen, setOtherSheetOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<number | null>(null)

  if (!profile || !sets.loaded)
    return (
      <TodaySkeleton
        header={<TodayHeader date={now} place={chosenPlace ?? undefined} onPlace={choosePlace} />}
      />
    )

  const { schedule, plan, rest, week, place, items, doneCount, next, planEmpty, planned } =
    todayPlan(profile, sets, workouts, now, chosenPlace)

  const start = (set: ListedTemplate) => {
    setOtherSheetOpen(false)
    startWorkout.start({ ...set.ref, name: set.name }, toSessionEntries(set.entries, byId ?? {}))
  }

  const editDay = (refs: TemplateRef[]) => {
    if (editingDay === null) return

    if (week.days[editingDay].today) setOpenSetIndex(null)
    update({ schedule: { ...schedule, [weekdays[editingDay]]: refs } })
  }

  return (
    <>
      <TodayHeader
        date={now}
        place={place}
        onPlace={(next) => {
          // The open set's index belongs to the other place's list.
          setOpenSetIndex(null)
          choosePlace(next)
        }}
      />

      <div className="flex flex-col gap-7 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] min-[900px]:items-start min-[900px]:gap-12">
        <div className="flex min-w-0 flex-col gap-7">
          <InstallHint />
          <RecoveredWorkout uid={user.uid} />
          <RunningWorkoutCard />

          {rest ? (
            <RestDay
              now={now}
              planEmpty={planEmpty}
              next={next}
              find={sets.find}
              onPlan={() => setEditingDay(week.days.findIndex((day) => day.today))}
              onOther={() => setOtherSheetOpen(true)}
            />
          ) : (
            <section aria-labelledby="today-kicker" className="flex flex-col gap-3.5">
              <p id="today-kicker" className="text-[13px] text-muted-foreground">
                По расписанию · {weekdayName(now)} · сделано {doneCount} из {plan.sets.length}
              </p>
              {items.length === 0 ? (
                <>
                  <p className="text-[15px] leading-[1.45] text-muted-foreground">
                    {place === 'home'
                      ? 'На сегодня нет наборов для дома.'
                      : 'На сегодня нет наборов для зала.'}{' '}
                    Переключите место наверху или выберите другую тренировку.
                  </p>
                  <Button variant="outline" size="ghost" onClick={() => setOtherSheetOpen(true)}>
                    Другая тренировка
                  </Button>
                </>
              ) : (
                <TodaySets
                  items={items}
                  open={openSetIndex ?? plan.current}
                  onOpen={setOpenSetIndex}
                  onStart={start}
                  onOther={() => setOtherSheetOpen(true)}
                />
              )}
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
          <LastWorkout workout={workouts.at(0)} />

          <WeekBlock week={week} find={sets.find} onOpenDay={setEditingDay} />
        </aside>
      </div>

      <OtherWorkoutSheet
        open={otherSheetOpen}
        onOpenChange={setOtherSheetOpen}
        sets={sets.all}
        planned={planned}
        onPick={start}
      />

      <RunningWorkoutSheet open={startWorkout.blocked} onOpenChange={startWorkout.setBlocked} />

      <DaySheet
        date={editingDay === null ? null : week.days[editingDay].date}
        refs={editingDay === null ? [] : schedule[weekdays[editingDay]]}
        sets={sets.all}
        readyTemplates={sets.readyTemplates}
        place={place}
        find={sets.find}
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
