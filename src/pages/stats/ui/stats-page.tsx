import { useMemo } from 'react'

import { useProfile } from '@/entities/profile'
import { useWorkoutHistory } from '@/entities/workout'
import type { AuthUser } from '@/shared/api'
import { PageHeader } from '@/shared/ui'
import { addDays, startOfDay, useToday } from '@/shared/lib'

import { firstMonth } from '../model/calendar'
import { longDate } from '../model/format'
import { weekMuscleLoad } from '../model/muscle-load'
import { BodyCharts } from './body-charts'
import { ExerciseProgress } from './exercise-progress'
import { Regularity } from './regularity'
import { WeekMuscles } from './week-muscles'

// The whole history in one query; the epoch is before any workout.
const historyRange = (now: Date) => ({ from: new Date(0), to: addDays(startOfDay(now), 1) })

// stats.html: muscles of the week, regularity, exercise progress, body and wellbeing.
export function StatsPage({ user }: { user: AuthUser }) {
  const now = useToday()
  const range = useMemo(() => historyRange(now), [now])
  const workouts = useWorkoutHistory(user.uid, range)
  const { profile } = useProfile(user.uid)

  // The calendar and the charts start at the month of the first workout.
  const start = (workouts && firstMonth(workouts)) ?? new Date(now.getFullYear(), now.getMonth(), 1)

  const plannedPerWeek = profile
    ? Object.values(profile.schedule).reduce((n, day) => n + day.length, 0)
    : 0

  return (
    <>
      <PageHeader title="Статистика" subtitle={longDate(now)} />

      {workouts === undefined ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-x-12 min-[900px]:[grid-template-areas:'muscles_regular'_'muscles_progress'_'body_body']">
          <WeekMuscles
            load={weekMuscleLoad(workouts, now)}
            now={now}
            className="min-[900px]:[grid-area:muscles]"
          />
          <Regularity
            workouts={workouts}
            now={now}
            firstMonth={start}
            plannedPerWeek={plannedPerWeek}
            className="min-[900px]:[grid-area:regular]"
          />
          <ExerciseProgress
            workouts={workouts}
            from={start}
            now={now}
            className="min-[900px]:[grid-area:progress]"
          />
          <BodyCharts
            workouts={workouts}
            from={start}
            now={now}
            className="min-[900px]:[grid-area:body]"
          />
        </div>
      )}
    </>
  )
}
