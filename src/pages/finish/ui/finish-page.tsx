import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { photoUrl, useCatalog, type Exercise } from '@/entities/exercise'
import { formatClock, selectFinishing, useSessionStore } from '@/entities/session'
import {
  compareRecords,
  discardWorkout,
  finishWorkout,
  recordsByExercise,
  setsDone,
  useExerciseStats,
  useLastBodyWeight,
  volumeKg,
  type RecordKey,
  type Records,
} from '@/entities/workout'
import type { AuthUser } from '@/shared/api'
import { Button, ExercisePhoto, Sheet, SheetContent } from '@/shared/ui'

import { decimal, mass, setsLine } from '../lib/format'
import { emptySurvey, surveyAnswers } from '../lib/survey'
import { Survey } from './survey'

const cta = 'h-auto min-h-16 w-full rounded-lg border-0 text-lg font-bold uppercase'

const day = (date: Date) =>
  date.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })

const RECORD_LABELS: Record<RecordKey, string> = {
  maxWeightKg: 'Макс. вес',
  maxVolumeKg: 'Объём за тренировку',
  bestSet: 'Лучший подход',
}

const recordValue = (key: RecordKey, records: Records | undefined) => {
  if (key === 'bestSet') {
    const set = records?.bestSet
    return set && `${set.reps} × ${decimal(set.weightKg)} кг`
  }

  const kg = records?.[key]
  return kg === undefined ? undefined : `${decimal(kg)} кг`
}

// finish.html: summary on the left, the survey on the right from 900px; no app navigation.
export function FinishPage({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const finishing = useSessionStore(selectFinishing)
  const { data: catalog } = useCatalog()
  const previousWeight = useLastBodyWeight(user.uid)
  const [survey, setSurvey] = useState(emptySurvey)
  const [confirmEmpty, setConfirmEmpty] = useState(false)

  const workout = finishing?.workout
  const entries = useMemo(() => workout?.entries ?? [], [workout])
  const current = useMemo(() => recordsByExercise(entries), [entries])
  const stats = useExerciseStats(user.uid, Object.keys(current))
  const byId = useMemo(
    () =>
      Object.fromEntries((catalog ?? []).map((e) => [e.id, e])) as Record<
        string,
        Exercise | undefined
      >,
    [catalog],
  )

  // The guard sends the page home once the store is cleared.
  if (!finishing || !workout) return null

  const records = stats
    ? Object.entries(current).flatMap(([id, records]) => {
        const previous = stats[id]?.records
        const { improved } = compareRecords(previous, records)
        const name = entries.find((e) => e.exerciseId === id)?.name ?? id

        return improved.map((key) => ({ id, key, name, now: records, previous }))
      })
    : []

  const durationSec = Math.round(
    ((workout.endedAt ?? workout.updatedAt).toMillis() - workout.startedAt.toMillis()) / 1000,
  )
  const done = entries.filter((e) => e.status === 'done').length

  // Writes are fired, never awaited (research R2), so the page leaves at once.
  const save = () => {
    const finished = useSessionStore.getState().finish(surveyAnswers(survey, previousWeight?.kg))
    if (finished) finishWorkout(user.uid, finished.workoutId, finished.workout, byId)
    void navigate('/')
  }

  const discard = () => {
    useSessionStore.getState().discard()
    discardWorkout(user.uid, finishing.workoutId)
    void navigate('/')
  }

  return (
    <div className="flex flex-col gap-6 pt-2 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-x-16">
      <div className="flex min-w-0 flex-col gap-5">
        <header>
          <p className="text-[13px] font-bold tracking-[0.04em] text-primary uppercase">
            Тренировка завершена
          </p>
          <h1 className="mt-1 text-[30px] leading-[1.05] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-5xl">
            Отличная работа
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {workout.template.name} · {day(workout.startedAt.toDate())}
          </p>
        </header>

        <dl className="grid grid-cols-3 border-y border-border">
          {[
            ['Время', formatClock(durationSec)],
            ['Упражнения', `${done}`, `из ${entries.length}`],
            ['Объём', ...mass(volumeKg(entries)).split(' ')],
          ].map(([label, value, unit]) => (
            <div key={label} className="py-3">
              <dt className="mb-0.5 text-xs text-muted-foreground">{label}</dt>
              <dd className="text-[26px] font-bold tabular-nums">
                {value}
                {unit && (
                  <em className="text-[15px] font-semibold text-muted-foreground not-italic">
                    {' '}
                    {unit}
                  </em>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {records.length > 0 && (
          <section aria-labelledby="h-records" className="flex flex-col gap-2">
            <h2
              id="h-records"
              className="text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase"
            >
              Новые рекорды
            </h2>
            {records.map(({ id, key, name, now, previous }) => (
              <p
                key={`${id}-${key}`}
                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 rounded-lg border border-primary px-3.5 py-3"
              >
                <span className="row-span-2 rounded-full bg-primary px-2 py-1 text-[11px] font-extrabold text-on-accent uppercase">
                  Рекорд
                </span>
                <b className="text-[15px]">{name}</b>
                <span className="text-[13px] text-muted-foreground">
                  {RECORD_LABELS[key]}:{' '}
                  <strong className="font-semibold text-foreground tabular-nums">
                    {recordValue(key, now)}
                  </strong>{' '}
                  · было {recordValue(key, previous)}
                </span>
              </p>
            ))}
          </section>
        )}

        <section aria-labelledby="h-entries">
          <h2
            id="h-entries"
            className="mb-2.5 text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase"
          >
            Упражнения
          </h2>
          <ul>
            {entries.map((entry, i) => {
              const line = setsLine(entry)
              const exercise = byId[entry.exerciseId]

              return (
                <li
                  key={`${entry.exerciseId}-${i}`}
                  className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2.5 last:border-b"
                >
                  <ExercisePhoto
                    src={exercise && photoUrl(exercise, 0)}
                    loading="lazy"
                    className={`size-12 rounded-lg bg-surface object-cover ${line ? '' : 'opacity-35'}`}
                  />
                  <div className="min-w-0">
                    <b
                      className={`block truncate text-[15px] font-semibold ${line ? '' : 'text-muted-foreground line-through'}`}
                    >
                      {entry.name}
                    </b>
                    <small className="text-[13px] text-muted-foreground tabular-nums">
                      {line ?? 'не выполнено'}
                    </small>
                  </div>
                  {line ? (
                    <span className="text-right text-[13px] text-muted-foreground tabular-nums">
                      {volumeKg([entry]) > 0 && mass(volumeKg([entry]))}
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-2 px-2 py-[3px] text-xs text-muted-foreground">
                      пропущено
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-5 min-[900px]:sticky min-[900px]:top-10">
        <Survey value={survey} onChange={setSurvey} previousWeight={previousWeight} />
        <Button
          className={cta}
          onClick={() => (setsDone(entries) === 0 ? setConfirmEmpty(true) : save())}
        >
          Сохранить тренировку
        </Button>
      </div>

      <Sheet open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <SheetContent
          title="Ни одного подхода"
          description="В этой тренировке нет записанных подходов. Удалить её или сохранить как есть?"
        >
          <Button className={cta} onClick={discard}>
            Удалить тренировку
          </Button>
          <Button variant="outline" className="h-auto min-h-12 rounded-lg" onClick={save}>
            Сохранить всё равно
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
