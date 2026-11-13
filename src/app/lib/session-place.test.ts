import { describe, expect, it } from 'vitest'

import type { SessionData } from '@/entities/session'

import { placeOf } from './session-place'

describe('placeOf', () => {
  it('sends a running workout to the session and an ended one to the finish screen', () => {
    const at = (s: Partial<SessionData>) =>
      placeOf({ workout: null, finished: null, ...s } as SessionData)
    const workout = {} as NonNullable<SessionData['workout']>

    expect(at({ workout })).toBe('/session')
    expect(at({ workout, finished: { workoutId: 'w', workout } })).toBe('/session/finish')
    expect(at({})).toBe('/')
  })
})
