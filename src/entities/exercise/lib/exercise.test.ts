import { describe, expect, it } from 'vitest'

import { equipmentLabels, equipmentList } from '../config/labels'
import type { Exercise } from '../model/types'

import { isGymOnly, photoUrl } from './exercise'

const exercise = (equipment: Exercise['equipment']): Exercise => ({
  id: 'Test',
  name: 'Test',
  kind: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment,
  instructions: [],
  images: ['Test/0.jpg', 'Test/1.jpg'],
})

describe('isGymOnly', () => {
  it('treats body weight as always available', () => {
    expect(isGymOnly(exercise('body only'), [])).toBe(false)
  })

  it('treats exercises without equipment as available', () => {
    expect(isGymOnly(exercise(null), [])).toBe(false)
  })

  it('marks equipment missing at home', () => {
    expect(isGymOnly(exercise('barbell'), ['dumbbell', 'pull-up bar'])).toBe(true)
  })

  it('does not mark equipment the person has at home', () => {
    expect(isGymOnly(exercise('pull-up bar'), ['dumbbell', 'pull-up bar'])).toBe(false)
  })
})

describe('photoUrl', () => {
  it('builds the static path and returns undefined past the last photo', () => {
    expect(photoUrl(exercise(null), 1)).toBe('/catalog/images/Test/1.jpg')
    expect(photoUrl(exercise(null), 2)).toBeUndefined()
  })
})

describe('equipmentList', () => {
  it('lists every labelled equipment once', () => {
    expect([...equipmentList].sort()).toEqual(Object.keys(equipmentLabels).sort())
  })
})
