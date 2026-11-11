import { useState } from 'react'

import { muscleLabels } from '@/entities/exercise'
import type { Muscle } from '@/shared/api'
import { cn, n1 } from '@/shared/lib'

import { dayRange, formatSets, formatWorkouts, plural } from '../../model/format'
import { loadLevel, loadLevelLabels, type weekMuscleLoad } from '../../model/muscle-load'
import { MuscleLegend, MuscleMap, offFigureMuscles } from '../muscle-map'
import { note, Section, subheading } from '../section'

type WeekLoad = ReturnType<typeof weekMuscleLoad>

export function WeekMuscles({
  load,
  now,
  className,
}: {
  load: WeekLoad
  now: Date
  className?: string
}) {
  const [picked, setPicked] = useState<Muscle | null>(null)
  const pick = (muscle: Muscle) => setPicked((current) => (current === muscle ? null : muscle))

  const trainedOffFigure = offFigureMuscles.filter((m) => load.sets[m] > 0)
  const empty = load.workouts === 0

  return (
    <Section
      id="h-muscles"
      title="Нагрузка на мышцы за неделю"
      sub={`${dayRange(load.from, now)} · ${formatWorkouts(load.workouts)}`}
      className={className}
    >
      <MuscleMap load={load.sets} selected={picked} onSelect={pick} />
      <MuscleLegend />

      {empty ? (
        <p className="text-[15px] leading-[1.4] text-muted-foreground">
          На этой неделе тренировок ещё не было. После первой мышцы на фигуре окрасятся по числу
          подходов.
        </p>
      ) : (
        <>
          <PickedMuscle muscle={picked} sets={picked ? load.sets[picked] : 0} />

          {trainedOffFigure.length > 0 && (
            <p className={note}>
              Нет на фигуре:{' '}
              {trainedOffFigure
                .map((m) => `${muscleLabels[m].toLowerCase()} — ${formatSets(load.sets[m])}`)
                .join(', ')}
            </p>
          )}

          <div>
            <h3 className={cn(subheading, 'mb-2')}>Ещё не тренировали на этой неделе</h3>
            {load.untrained.length === 0 ? (
              <p className={note}>Все группы мышц получили нагрузку.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {load.untrained.map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      aria-pressed={picked === m}
                      className="min-h-11 rounded-full border border-dashed border-muted-foreground bg-surface-2 px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-solid aria-pressed:border-foreground"
                      onClick={() => pick(m)}
                    >
                      {muscleLabels[m]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <p className={note}>
        Основная мышца упражнения получает целый подход, вспомогательная — половину.
      </p>
    </Section>
  )
}

function PickedMuscle({ muscle, sets }: { muscle: Muscle | null; sets: number }) {
  return (
    <div
      aria-live="polite"
      className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-y border-border py-2.5"
    >
      {muscle === null ? (
        <b className="text-[15px] font-normal text-muted-foreground">
          Нажмите на мышцу, чтобы увидеть подходы
        </b>
      ) : (
        <>
          <b className="text-lg font-bold">{muscleLabels[muscle]}</b>
          <span className="row-span-2 text-right text-[26px] font-bold tabular-nums">
            {n1(sets)}
            <small className="block text-xs font-normal text-muted-foreground">
              {plural(sets, ['подход', 'подхода', 'подходов'])} за неделю
            </small>
          </span>
          <small className="col-start-1 text-[13px] text-muted-foreground">
            {loadLevelLabels[loadLevel(sets)]}
          </small>
        </>
      )}
    </div>
  )
}
