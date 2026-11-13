import { weightChange } from '@/entities/workout'
import type { Workout } from '@/shared/api'
import { n1 } from '@/shared/lib'

import { energyWords, wellbeingWords } from '../../config/survey-words'
import { previousBodyWeight } from '../../model/view'
import { Answer } from '../answer'
import { Squares } from '../squares'

interface WorkoutSurveyProps {
  workout: Workout
  history: readonly Workout[]
}

export function WorkoutSurvey({ workout, history }: WorkoutSurveyProps) {
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
