import { describe, expect, it } from 'vitest'

import { defaultProfile } from '../model/profile'
import { weekdays } from './weekdays'

describe('weekdays', () => {
  it('lists every key of the schedule, Monday first', () => {
    expect([...weekdays].sort()).toEqual(Object.keys(defaultProfile.schedule).sort())
    expect(weekdays[0]).toBe('mon')
    expect(weekdays.at(-1)).toBe('sun')
  })
})
