import { useState } from 'react'

import { muscleLabels } from '@/entities/exercise'
import type { Muscle } from '@/shared/api'
import { Section } from '@/shared/ui'

import { offFigureMuscles } from '../../config/shapes'
import { dayRange, formatSets, formatWorkouts } from '../../lib/format'
import type { WeekLoad } from '../../model/types'
import { MuscleLegend } from '../muscle-legend'
import { MuscleMap } from '../muscle-map'
import { PickedMuscle } from '../picked-muscle'

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
            <p className="text-xs text-muted-foreground">
              Нет на фигуре:{' '}
              {trainedOffFigure
                .map((m) => `${muscleLabels[m].toLowerCase()} — ${formatSets(load.sets[m])}`)
                .join(', ')}
            </p>
          )}

          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-muted-foreground">
              Ещё не тренировали на этой неделе
            </h3>
            {load.untrained.length === 0 ? (
              <p className="text-xs text-muted-foreground">Все группы мышц получили нагрузку.</p>
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

      <p className="text-xs text-muted-foreground">
        Основная мышца упражнения получает целый подход, вспомогательная — половину.
      </p>
    </Section>
  )
}
