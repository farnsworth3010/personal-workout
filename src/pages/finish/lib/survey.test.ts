import { describe, expect, it } from 'vitest'

import { emptySurvey, surveyAnswers } from './survey'

describe('surveyAnswers', () => {
  it('keeps the answered items and falls back to the previous weight', () => {
    expect(surveyAnswers({ ...emptySurvey, wellbeing: 4, energy: 3 }, 82.4)).toEqual({
      wellbeing: 4,
      energy: 3,
      bodyWeightKg: 82.4,
    })
    expect(surveyAnswers({ ...emptySurvey, weightKg: 82.9 }, 82.4)).toEqual({ bodyWeightKg: 82.9 })
  })

  it('leaves out skipped and unanswered items', () => {
    const skipped = new Set(['wellbeing', 'weight'] as const)

    expect(surveyAnswers({ wellbeing: 4, energy: 2, weightKg: 80, skipped }, 82.4)).toEqual({
      energy: 2,
    })
    expect(surveyAnswers(emptySurvey, undefined)).toEqual({})
  })
})
