import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { findExercise, muscleLabels, photoUrl, useCatalog } from '@/entities/exercise'
import { useWorkout, useWorkoutHistory } from '@/entities/workout'
import type { AuthUser, Workout } from '@/shared/api'
import { cn } from '@/shared/lib'
import { EmptyState } from '@/shared/ui'

import {
  energyWords,
  exerciseRows,
  formatDuration,
  formatSet,
  formatVolume,
  n1,
  previousBodyWeight,
  wellbeingWords,
  weightChange,
  workoutWhen,
  type ExerciseRow,
} from '../model/view'

const heading = 'text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase'
const unit = 'text-[15px] font-semibold text-muted-foreground not-italic'

// The same key as the statistics page, so both share one cached query.
const historyRange = () => {
  const now = new Date()
  return { from: new Date(0), to: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) }
}

// workout.html: a finished workout with its sets and survey.
export function WorkoutPage({ user }: { user: AuthUser }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const workout = useWorkout(user.uid, id)
  const [range] = useState(historyRange)
  const history = useWorkoutHistory(user.uid, range)

  // Opened from a link inside the app it goes back; opened directly it goes to statistics.
  const back = () => {
    if (location.key === 'default') void navigate('/stats')
    else void navigate(-1)
  }

  if (workout === undefined) return <p className="text-sm text-muted-foreground">Загрузка…</p>

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
  const [volume, volumeUnit] = formatVolume(summary?.volumeKg ?? 0)

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
        <h1 className="mt-1 text-[30px] leading-[1.05] font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere] uppercase min-[900px]:text-[40px]">
          {workout.template.name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">{workoutWhen(workout)}</p>
      </header>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid grid-cols-3 border-y border-border">
          <Stat label="Время">{formatDuration(summary?.durationSec ?? 0)}</Stat>
          <Stat label="Подходы">
            {summary?.setsDone ?? 0}{' '}
            <em className={unit}>из {rows.reduce((n, r) => n + r.planned, 0)}</em>
          </Stat>
          <Stat label="Объём">
            {volume} <em className={unit}>{volumeUnit}</em>
          </Stat>
        </div>

        <div>
          <h2 className={heading}>Упражнения</h2>
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
          <h2 className={heading}>Как прошло</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Ответы после тренировки</p>
        </div>
        <Survey workout={workout} history={history ?? []} />
        <p className="text-xs text-muted-foreground">
          Лучший подход упражнения — с наибольшим расчётным максимумом на один повтор.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 py-3">
      <small className="mb-0.5 block text-xs text-muted-foreground">{label}</small>
      <b className="text-[26px] font-bold tabular-nums">{children}</b>
    </div>
  )
}

function ExerciseItem({ row }: { row: ExerciseRow }) {
  const { data: catalog } = useCatalog()
  const exercise = catalog && findExercise(catalog, row.exerciseId)
  const photo = exercise && photoUrl(exercise, 0)
  const muscles = exercise
    ? [
        exercise.primaryMuscles.map((m) => muscleLabels[m].toLowerCase()).join(', '),
        exercise.secondaryMuscles.map((m) => muscleLabels[m].toLowerCase()).join(', '),
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const skipped = row.state === 'skipped'

  return (
    <li className="border-t border-border py-3 last:border-b">
      <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className={cn('size-12 rounded-lg bg-surface object-cover', skipped && 'opacity-35')}
          />
        ) : (
          <span className="size-12 rounded-lg bg-surface" />
        )}
        <div className="min-w-0">
          <b
            className={cn(
              'block text-[15px] font-semibold [overflow-wrap:anywhere]',
              skipped && 'text-muted-foreground line-through',
            )}
          >
            {row.name}
          </b>
          {muscles && <small className="text-[13px] text-muted-foreground">{muscles}</small>}
        </div>
        {skipped ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
            пропущено
          </span>
        ) : row.state === 'partial' ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-warn tabular-nums">
            {row.sets.length} из {row.planned}
          </span>
        ) : row.volumeKg > 0 ? (
          <span className="text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
            {n1(row.volumeKg)} кг
          </span>
        ) : (
          <span />
        )}
      </div>

      {row.sets.length > 0 && (
        <ol aria-label={`Подходы: ${row.name}`} className="mt-2.5 ml-15 flex flex-col tabular-nums">
          {row.sets.map((set, i) => (
            <li
              key={i}
              className="grid grid-cols-[28px_1fr_auto] items-baseline gap-2 border-t border-dashed border-border py-1.5 text-[15px] first:border-t-0"
            >
              <span className="text-[13px] text-muted-foreground">{i + 1}</span>
              <span>{formatSet(set)}</span>
              {i === row.best ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-extrabold text-on-accent uppercase">
                  лучший
                </span>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}

function Survey({ workout, history }: { workout: Workout; history: readonly Workout[] }) {
  const { wellbeing, energy, bodyWeightKg } = workout.survey
  const none = <span className="text-sm text-muted-foreground">не указано</span>
  const change =
    bodyWeightKg === undefined
      ? null
      : weightChange(bodyWeightKg, previousBodyWeight(workout, history))

  return (
    <div className="flex flex-col">
      <Answer title="Самочувствие" note={wellbeing && wellbeingWords[wellbeing - 1]}>
        {wellbeing ? <Squares value={wellbeing} label="Самочувствие" /> : none}
      </Answer>
      <Answer title="Энергия" note={energy && energyWords[energy - 1]}>
        {energy ? <Squares value={energy} label="Энергия" /> : none}
      </Answer>
      <Answer title="Вес тела" note={change}>
        {bodyWeightKg === undefined ? (
          none
        ) : (
          <span className="text-[22px] font-bold tabular-nums">
            {n1(bodyWeightKg)}{' '}
            <em className="text-sm font-semibold text-muted-foreground not-italic">кг</em>
          </span>
        )}
      </Answer>
    </div>
  )
}

function Answer({
  title,
  note,
  children,
}: {
  title: string
  note?: string | null | 0
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-3 border-t border-border py-2 last:border-b">
      <h3 className="text-[15px] font-semibold">
        {title}
        {note ? (
          <small className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
            {note}
          </small>
        ) : null}
      </h3>
      {children}
    </div>
  )
}

function Squares({ value, label }: { value: number; label: string }) {
  return (
    <span role="img" aria-label={`${label}: ${value} из 5`} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={cn('size-[22px] rounded-sm', i <= value ? 'bg-primary' : 'bg-surface-2')}
        />
      ))}
    </span>
  )
}
