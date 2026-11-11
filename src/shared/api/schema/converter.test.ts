import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { profileConverter, templateConverter, workoutConverter } from './converter'
import type { Template, Workout } from './documents'

const snapshotOf = (data: unknown) => ({ data: () => data }) as unknown as QueryDocumentSnapshot

const at = Timestamp.fromMillis(1_700_000_123_456)

const template = (): Template => ({
  name: 'Push',
  entries: [{ id: 'a1', exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 90 }],
  copiedFrom: null,
  createdAt: at,
  updatedAt: at,
})

const workout = (): Workout => ({
  status: 'active',
  startedAt: at,
  endedAt: null,
  template: { source: 'own', id: 't1', name: 'Push' },
  entries: [
    {
      id: 'a1',
      exerciseId: 'Pushups',
      name: 'Pushups',
      kind: 'bodyweight',
      status: 'pending',
      plan: { sets: 3, reps: 10, restSec: 90 },
      sets: [{ n: 1, reps: 10, at: new Timestamp(1_700_000_200, 999_999_999) }],
    },
  ],
  survey: {},
  summary: null,
  updatedAt: at,
})

describe('profileConverter', () => {
  const legacy = {
    homeEquipment: [],
    defaultRestSec: 90,
    defaultWeightStepKg: 2.5,
    sounds: true,
    animations: true,
    schedule: {
      mon: { source: 'own', id: 't1' },
      tue: null,
      wed: [{ source: 'ready', id: 'r1' }],
      thu: null,
      fri: null,
      sat: null,
      sun: null,
    },
    activeWorkoutId: null,
    updatedAt: at,
  }

  it('reads a one-ref-per-day schedule as lists', () => {
    expect(profileConverter.fromFirestore(snapshotOf(legacy)).schedule).toEqual({
      mon: [{ source: 'own', id: 't1' }],
      tue: [],
      wed: [{ source: 'ready', id: 'r1' }],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    })
  })

  it('still rejects the old shape on write and a missing day on read', () => {
    expect(() => profileConverter.toFirestore(legacy as never)).toThrow()
    expect(() =>
      profileConverter.fromFirestore(snapshotOf({ ...legacy, schedule: { mon: null } })),
    ).toThrow()
  })
})

describe('entry ids', () => {
  const omitId = (entry: object) =>
    Object.fromEntries(Object.entries(entry).filter(([k]) => k !== 'id'))
  const withoutIds = <T extends { entries: object[] }>(doc: T) => ({
    ...doc,
    entries: doc.entries.map(omitId),
  })

  it('gives entries written before entry ids one from their position, the same on every read', () => {
    const stored = withoutIds({
      ...template(),
      entries: [...template().entries, ...template().entries],
    })

    const first = templateConverter.fromFirestore(snapshotOf(stored))
    const again = templateConverter.fromFirestore(snapshotOf(stored))

    expect(first.entries.map((e) => e.id)).toEqual(['e0', 'e1'])
    expect(again.entries).toEqual(first.entries)
    expect(workoutConverter.fromFirestore(snapshotOf(withoutIds(workout()))).entries[0]?.id).toBe(
      'e0',
    )
  })

  it('keeps existing ids and allows one exercise twice', () => {
    const twice = {
      ...template(),
      entries: [template().entries[0], { ...template().entries[0], id: 'b2' }],
    }

    expect(templateConverter.fromFirestore(snapshotOf(twice)).entries.map((e) => e.id)).toEqual([
      'a1',
      'b2',
    ])
    expect(templateConverter.toFirestore(twice)).toEqual(twice)
  })

  it('requires an id on write', () => {
    expect(() => templateConverter.toFirestore(withoutIds(template()) as never)).toThrow()
  })
})

describe('zodConverter', () => {
  it('round-trips Timestamps with nanosecond precision', () => {
    const stored = workoutConverter.toFirestore(workout())
    const read = workoutConverter.fromFirestore(snapshotOf(stored))

    expect(read.startedAt).toBeInstanceOf(Timestamp)
    expect(read.startedAt.isEqual(at)).toBe(true)
    expect(read.entries[0]?.sets[0]?.at.nanoseconds).toBe(999_999_999)
    expect(read).toEqual(workout())
  })

  it('rejects an invalid document on write', () => {
    expect(() => templateConverter.toFirestore({ ...template(), name: '' })).toThrow()
  })

  it('rejects an invalid document on read', () => {
    expect(() =>
      templateConverter.fromFirestore(snapshotOf({ ...template(), entries: [] })),
    ).toThrow()
  })

  it('rejects a millisecond number where a Timestamp belongs', () => {
    expect(() =>
      templateConverter.fromFirestore(snapshotOf({ ...template(), createdAt: 1_700_000_000_000 })),
    ).toThrow()
  })

  it('validates only the given keys of a merge write', () => {
    expect(templateConverter.toFirestore({ name: 'Pull' }, { merge: true })).toEqual({
      name: 'Pull',
    })
    expect(() => templateConverter.toFirestore({ name: '' }, { merge: true })).toThrow()
    expect(() =>
      templateConverter.toFirestore({ place: 'gym' } as never, { merge: true }),
    ).toThrow()
  })
})
