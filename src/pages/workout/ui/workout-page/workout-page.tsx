import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useFullHistory, useWorkout } from '@/entities/workout'
import type { AuthUser } from '@/shared/api'
import { formatDuration, formatMass } from '@/shared/lib'
import { EmptyState, Heading, Stat, StatRow, Title } from '@/shared/ui'
import { WorkoutSkeleton } from '@/widgets/page-skeletons'

import { workoutWhen } from '../../lib/format'
import { exerciseRows } from '../../model/view'
import { ExerciseItem } from '../exercise-item'
import { WorkoutSurvey } from '../workout-survey'

// workout.html: a finished workout with its sets and survey.
export function WorkoutPage({ user }: { user: AuthUser }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const workout = useWorkout(user.uid, id)
  const history = useFullHistory(user.uid)

  // Opened from a link inside the app it goes back; opened directly it goes to statistics.
  const back = () => {
    if (location.key === 'default') void navigate('/stats')
    else void navigate(-1)
  }

  if (workout === undefined) return <WorkoutSkeleton />

  if (workout?.status !== 'done') {
    return (
      <EmptyState
        title="Тренировка не найдена"
        description="Возможно, она удалена или ещё не завершена."
      >
        <Link to="/stats" className="text-[15px] underline underline-offset-3">
          К статистике
        </Link>
      </EmptyState>
    )
  }

  const rows = exerciseRows(workout)
  const summary = workout.summary
  const volume = formatMass(summary?.volumeKg ?? 0)

  return (
    <div className="flex min-w-0 flex-col gap-6 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-x-16">
      <header className="min-[900px]:col-span-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center text-[15px] text-muted-foreground"
          onClick={back}
        >
          ‹ Назад
        </button>
        <p className="text-[13px] font-bold tracking-[0.04em] text-primary uppercase">Тренировка</p>
        <Title className="mt-1 text-[30px] leading-[1.05] [overflow-wrap:anywhere]">
          {workout.template.name}
        </Title>
        <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">{workoutWhen(workout)}</p>
      </header>

      <div className="flex min-w-0 flex-col gap-5">
        <StatRow>
          <Stat label="Время" value={formatDuration(summary?.durationSec ?? 0)} />
          <Stat
            label="Подходы"
            value={summary?.setsDone ?? 0}
            unit={`из ${rows.reduce((n, r) => n + r.planned, 0)}`}
          />
          <Stat label="Объём" value={volume.value} unit={volume.unit} />
        </StatRow>

        <div>
          <Heading>Упражнения</Heading>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            В том порядке, в котором выполнялись
          </p>
        </div>
        <ul aria-label="Упражнения тренировки">
          {rows.map((row, i) => (
            <ExerciseItem key={`${row.exerciseId}-${i}`} row={row} />
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-col gap-5 min-[900px]:sticky min-[900px]:top-6">
        <div>
          <Heading>Как прошло</Heading>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Ответы после тренировки</p>
        </div>
        <WorkoutSurvey workout={workout} history={history ?? []} />
        <p className="text-xs text-muted-foreground">
          Лучший подход упражнения — с наибольшим расчётным максимумом на один повтор.
        </p>
      </div>
    </div>
  )
}
