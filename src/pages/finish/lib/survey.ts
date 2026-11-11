import type { Workout } from '@/shared/api'

export type SurveyKey = 'wellbeing' | 'energy' | 'weight'

export interface SurveyState {
  wellbeing?: number
  energy?: number
  // Unset until changed: the previous weight is the answer by default.
  weightKg?: number
  skipped: ReadonlySet<SurveyKey>
}

export const emptySurvey: SurveyState = { skipped: new Set() }

// A skipped or unanswered item is left out of the stored survey.
export function surveyAnswers(
  { wellbeing, energy, weightKg, skipped }: SurveyState,
  previousKg: number | undefined,
): Workout['survey'] {
  const bodyWeightKg = weightKg ?? previousKg

  return {
    ...(!skipped.has('wellbeing') && wellbeing !== undefined && { wellbeing }),
    ...(!skipped.has('energy') && energy !== undefined && { energy }),
    ...(!skipped.has('weight') && bodyWeightKg !== undefined && { bodyWeightKg }),
  }
}
