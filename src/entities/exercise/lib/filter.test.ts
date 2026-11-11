import { describe, expect, it } from 'vitest'

import type { Equipment } from '@/shared/api'

import type { Exercise } from '../model/types'
import { filterCatalog, noFilter, type CatalogFilter } from './filter'

const exercise = (
  id: string,
  equipment: Exercise['equipment'],
  primaryMuscles: Exercise['primaryMuscles'],
  secondaryMuscles: Exercise['secondaryMuscles'] = [],
): Exercise => ({
  id,
  name: id.replaceAll('_', ' '),
  kind: 'strength',
  primaryMuscles,
  secondaryMuscles,
  equipment,
  instructions: [],
  images: [],
})

const catalog = [
  exercise('Barbell_Bench_Press', 'barbell', ['chest'], ['triceps', 'shoulders']),
  exercise('Pullups', 'pull-up bar', ['lats'], ['biceps']),
  exercise('Pushups', 'body only', ['chest'], ['triceps']),
  exercise('Childs_Pose', null, ['lower back'], ['glutes']),
  exercise('Leg_Press', 'machine', ['quadriceps'], ['glutes']),
  exercise('Dumbbell_Row', 'dumbbell', ['middle back'], ['lats']),
]

const ids = (filter: Partial<CatalogFilter>, home: Equipment[] = []) =>
  filterCatalog(catalog, { ...noFilter, ...filter }, home).map((e) => e.id)

describe('filterCatalog', () => {
  it('returns everything without filters', () => {
    expect(ids({})).toHaveLength(catalog.length)
  })

  it('searches the name case-insensitively', () => {
    expect(ids({ query: 'PRESS' })).toEqual(['Barbell_Bench_Press', 'Leg_Press'])
  })

  it('searches Russian muscle labels, primary and secondary, with ё = е', () => {
    expect(ids({ query: 'трицепс' })).toEqual(['Barbell_Bench_Press', 'Pushups'])
    expect(ids({ query: 'ягодицы' })).toEqual(['Childs_Pose', 'Leg_Press'])
  })

  it('searches the equipment label with ё = е', () => {
    expect(ids({ query: 'тренажер' })).toEqual(['Leg_Press'])
    expect(ids({ query: 'ТУРНИК' })).toEqual(['Pullups'])
  })

  it('filters by a muscle group over primary muscles', () => {
    expect(ids({ muscles: ['lats', 'middle back', 'lower back'] })).toEqual([
      'Pullups',
      'Childs_Pose',
      'Dumbbell_Row',
    ])
  })

  it('filters by equipment, counting no equipment as body weight', () => {
    expect(ids({ equipment: 'body only' })).toEqual(['Pushups', 'Childs_Pose'])
    expect(ids({ equipment: 'barbell' })).toEqual(['Barbell_Bench_Press'])
  })

  it('leaves only what the home equipment allows', () => {
    expect(ids({ homeOnly: true })).toEqual(['Pushups', 'Childs_Pose'])
    expect(ids({ homeOnly: true }, ['dumbbell', 'pull-up bar'])).toEqual([
      'Pullups',
      'Pushups',
      'Childs_Pose',
      'Dumbbell_Row',
    ])
  })

  it('matches abbreviations as in-order letters, word by word', () => {
    expect(ids({ query: 'db row' })).toEqual(['Dumbbell_Row'])
    expect(ids({ query: 'bbp' })).toEqual(['Barbell_Bench_Press'])
    expect(ids({ query: 'жим штанга' })).toEqual([])
  })

  it('combines filters', () => {
    expect(ids({ query: 'груд', homeOnly: true })).toEqual(['Pushups'])
  })
})
