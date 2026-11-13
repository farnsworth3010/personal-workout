import { Heading } from '@/shared/ui'

import type { SurveyKey, SurveyState } from '../../lib/survey'
import { BodyWeight } from '../body-weight'
import { BodyWeightSkeleton } from '../body-weight-skeleton'
import { Scale } from '../scale'
import { SurveyItem } from '../survey-item'

// finish.html's survey; every item can be skipped.
export function Survey({
  value,
  onChange,
  previousWeight,
}: {
  value: SurveyState
  onChange: (value: SurveyState) => void
  previousWeight: { kg: number; date: Date } | null | undefined
}) {
  const set = (patch: Partial<SurveyState>) => onChange({ ...value, ...patch })

  const toggle = (key: SurveyKey) => {
    const skipped = new Set(value.skipped)
    if (!skipped.delete(key)) skipped.add(key)
    set({ skipped })
  }

  return (
    <>
      <div>
        <Heading>Как прошло?</Heading>
        <p className="mt-1.5 text-sm text-muted-foreground">Любой пункт можно пропустить</p>
      </div>

      <SurveyItem
        title="Самочувствие"
        skipped={value.skipped.has('wellbeing')}
        onSkip={() => toggle('wellbeing')}
      >
        {(id) => (
          <Scale
            labelId={id}
            value={value.wellbeing}
            onChange={(wellbeing) => set({ wellbeing })}
            ends={['плохо', 'отлично']}
          />
        )}
      </SurveyItem>

      <SurveyItem
        title="Энергия"
        skipped={value.skipped.has('energy')}
        onSkip={() => toggle('energy')}
      >
        {(id) => (
          <Scale
            labelId={id}
            value={value.energy}
            onChange={(energy) => set({ energy })}
            ends={['нет сил', 'полно сил']}
          />
        )}
      </SurveyItem>

      <SurveyItem
        title="Вес тела"
        skipped={value.skipped.has('weight')}
        onSkip={() => toggle('weight')}
      >
        {(id) =>
          previousWeight === undefined ? (
            <BodyWeightSkeleton />
          ) : (
            <BodyWeight
              labelId={id}
              kg={value.weightKg}
              previous={previousWeight}
              onChange={(weightKg) => set({ weightKg })}
            />
          )
        }
      </SurveyItem>
    </>
  )
}
