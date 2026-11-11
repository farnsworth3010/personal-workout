import { Link } from 'react-router'

import { muscleLabels, photoUrl } from '@/entities/exercise'
import { estimateDurationMin, muscleGroupsOf } from '@/entities/template'
import { cn } from '@/shared/lib'
import { Button, buttonVariants, ExercisePhoto, HoldButton } from '@/shared/ui'

import { clock, musclesOf, placeLabel, planLine, setCount } from '../lib/format'
import { refKey, type ExercisesById, type SetInfo } from '../model/sets'

export interface TodaySet {
  set: SetInfo | undefined
  doneAt: Date | null | undefined
  workoutId?: string
  // Not undefined when the set is the other place's variant of the planned one.
  swappedTo?: string
}

// home.html's "Зал · спина, поясница": the place and the main muscles of the set.
const focus = (set: SetInfo, byId: ExercisesById) =>
  [
    placeLabel(set.place),
    muscleGroupsOf(set, byId)
      .slice(0, 3)
      .map((m) => muscleLabels[m].toLocaleLowerCase('ru'))
      .join(', '),
  ]
    .filter(Boolean)
    .join(' · ')

const meta = (set: SetInfo, byId: ExercisesById) =>
  `${placeLabel(set.place)} · ${set.entries.length} упр. · ~${estimateDurationMin(set, byId)} мин`

function Body({
  set,
  byId,
  onStart,
  onOther,
}: {
  set: SetInfo
  byId: ExercisesById
  onStart: () => void
  onOther: () => void
}) {
  return (
    <div className="flex flex-col gap-3.5 pt-1 pb-5">
      <dl className="grid grid-cols-3 border-y border-border">
        {[
          ['Упражнений', set.entries.length],
          ['Подходов', setCount(set.entries)],
          ['Время', `~${estimateDurationMin(set, byId)}`, 'мин'],
        ].map(([label, value, unit]) => (
          <div key={label} className="min-w-0 py-3">
            <dt className="mb-0.5 text-xs text-muted-foreground">{label}</dt>
            <dd className="text-[26px] font-bold tabular-nums">
              {value}
              {unit && (
                <span className="ml-[3px] text-[15px] font-semibold text-muted-foreground">
                  {unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-2 min-[900px]:grid-cols-[1fr_auto]">
        <HoldButton
          label="Начать тренировку"
          className={buttonVariants({ size: 'cta' })}
          onConfirm={onStart}
        />
        <Button variant="outline" size="ghost" onClick={onOther}>
          Другая тренировка
        </Button>
      </div>
      <ol aria-label={`Упражнения набора «${set.name}»`}>
        {set.entries.map((entry, i) => {
          const exercise = byId[entry.exerciseId]

          return (
            <li
              key={`${entry.exerciseId}-${i}`}
              className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-border py-2.5 first:border-t min-[900px]:grid-cols-[64px_1fr_auto] min-[900px]:gap-4"
            >
              <ExercisePhoto
                src={exercise && photoUrl(exercise, 0)}
                loading="lazy"
                className="size-[52px] rounded-lg bg-surface object-cover min-[900px]:size-16"
              />
              <div className="min-w-0">
                <b className="block text-[15px] leading-[1.25] font-semibold">
                  {exercise?.name ?? entry.exerciseId}
                </b>
                <small className="mt-0.5 block text-[13px] text-muted-foreground">
                  {musclesOf(exercise)}
                </small>
              </div>
              <span className="text-right text-[15px] font-semibold whitespace-nowrap tabular-nums min-[900px]:text-base">
                {planLine(entry)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// home.html's today list: done sets with their time, the open one with its exercises, the rest waiting.
export function TodaySets({
  items,
  open,
  byId,
  onOpen,
  onStart,
  onOther,
}: {
  items: readonly TodaySet[]
  open: number | null
  byId: ExercisesById
  onOpen: (index: number) => void
  onStart: (set: SetInfo) => void
  onOther: () => void
}) {
  return (
    <ol aria-label="Наборы на сегодня" className="border-t border-border">
      {items.map(({ set, doneAt, workoutId, swappedTo }, i) => {
        const done = doneAt !== null && doneAt !== undefined
        const isOpen = i === open && !done && set !== undefined
        const name = set?.name ?? 'Набор удалён'

        return (
          <li key={set ? `${refKey(set.ref)}-${i}` : i} className="border-b border-border">
            <div className="grid min-h-16 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-2">
              <span
                aria-hidden="true"
                className={`grid size-7 place-items-center rounded-full border text-[13px] font-bold tabular-nums ${
                  done
                    ? 'border-primary bg-primary text-on-accent'
                    : isOpen
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>

              {done || !set ? (
                <div className="flex min-h-11 min-w-0 flex-col justify-center">
                  <b className="text-[17px] leading-[1.2] font-bold">{name}</b>
                  {set && (
                    <small className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
                      {meta(set, byId)}
                    </small>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => onOpen(i)}
                  className="flex min-h-11 w-full min-w-0 flex-col justify-center text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
                >
                  <b
                    className={
                      isOpen
                        ? 'text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[34px]'
                        : 'text-[17px] leading-[1.2] font-bold'
                    }
                  >
                    {name}
                  </b>
                  <small
                    className={`text-muted-foreground tabular-nums ${isOpen ? 'mt-1 text-sm' : 'mt-0.5 text-[13px]'}`}
                  >
                    {isOpen
                      ? `${focus(set, byId)}${swappedTo ? ` · вариант для ${swappedTo}` : ''}`
                      : meta(set, byId)}
                  </small>
                </button>
              )}

              {done ? (
                <Link
                  to={`/workouts/${workoutId ?? ''}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold whitespace-nowrap text-primary tabular-nums underline-offset-3 hover:underline"
                >
                  <span className="sr-only">Сделано в </span>
                  <span aria-hidden="true">✓ </span>
                  {clock(doneAt)}
                </Link>
              ) : (
                set &&
                !isOpen && (
                  <HoldButton
                    label="Начать"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'h-auto min-h-11 rounded-lg bg-transparent px-4 text-sm font-semibold',
                    )}
                    onConfirm={() => onStart(set)}
                  />
                )
              )}
            </div>

            {isOpen && (
              <Body set={set} byId={byId} onStart={() => onStart(set)} onOther={onOther} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
