import { describe, expect, it } from 'vitest'

import { addToSetUrl } from './add-url'

describe('addToSetUrl', () => {
  it('opens the set or a new one with the exercise in ?add', () => {
    expect(addToSetUrl('t1', 'Barbell_Squat')).toBe('/templates/t1?add=Barbell_Squat')
    expect(addToSetUrl(null, '3/4 Sit-Up')).toBe('/templates/new?add=3%2F4+Sit-Up')
  })
})
