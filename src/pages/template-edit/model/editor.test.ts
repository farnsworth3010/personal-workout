import { describe, expect, it } from 'vitest'

import { templateEntrySchema, type ExerciseKind } from '@/shared/api'

import { move, newRow, previewEntries, rowOf, validate, type Row } from './editor'

const kinds: Record<string, ExerciseKind> = {
  Squat: 'strength',
  Pushups: 'bodyweight',
  Plank: 'timed',
  Run: 'cardio',
}
const kindOf = (id: string) => kinds[id]
const nameOf = (id: string) => id

const row = (exerciseId: string, sets: string, amount: string, rest: string): Row => ({
  key: exerciseId,
  exerciseId,
  sets,
  amount,
  rest,
})

describe('move', () => {
  it('swaps with the neighbour and ignores moves past the edges', () => {
    const rows = ['a', 'b', 'c']

    expect(move(rows, 0, 1)).toEqual(['b', 'a', 'c'])
    expect(move(rows, 2, -1)).toEqual(['a', 'c', 'b'])
    expect(move(rows, 0, -1)).toBe(rows)
    expect(move(rows, 2, 1)).toBe(rows)
  })
})

describe('reps versus duration by kind', () => {
  it('saves reps for strength and bodyweight, seconds for timed, minutes as seconds for cardio', () => {
    const rows = [
      row('Squat', '4', '8', '120'),
      row('Pushups', '3', '15', '60'),
      row('Plank', '3', '45', '30'),
      row('Run', '1', '12,5', '0'),
    ]

    const result = validate('Ноги', rows, kindOf, nameOf)

    expect(result).toEqual({
      ok: true,
      name: 'Ноги',
      entries: [
        { exerciseId: 'Squat', sets: 4, reps: 8, restSec: 120 },
        { exerciseId: 'Pushups', sets: 3, reps: 15, restSec: 60 },
        { exerciseId: 'Plank', sets: 3, durationSec: 45, restSec: 30 },
        { exerciseId: 'Run', sets: 1, durationSec: 750, restSec: 0 },
      ],
    })
    for (const entry of result.ok ? result.entries : []) templateEntrySchema.parse(entry)
  })

  it('round-trips stored entries through rows, cardio shown in minutes', () => {
    const entries = [
      { exerciseId: 'Run', sets: 1, durationSec: 600, restSec: 60 },
      { exerciseId: 'Squat', sets: 4, reps: 8, restSec: 120 },
    ]
    const rows = entries.map((e) => rowOf(e, kindOf(e.exerciseId)))

    expect(rows[0]).toMatchObject({ sets: '1', amount: '10', rest: '60' })
    expect(validate('x', rows, kindOf, nameOf)).toMatchObject({ ok: true, entries })
  })

  it('fills defaults by kind, strength rest from the profile', () => {
    expect(newRow('Squat', 'strength', 120)).toMatchObject({ sets: '3', amount: '10', rest: '120' })
    expect(newRow('Plank', 'timed', 120)).toMatchObject({ sets: '3', amount: '30', rest: '30' })
    expect(newRow('Run', 'cardio')).toMatchObject({ sets: '1', amount: '10', rest: '60' })
    expect(newRow('A', 'strength').key).not.toBe(newRow('A', 'strength').key)
  })
})

describe('validate', () => {
  const ok = [row('Squat', '3', '10', '90')]

  it('requires a name of 1-60 characters', () => {
    expect(validate('  ', ok, kindOf, nameOf)).toMatchObject({ ok: false, focus: 'name' })
    expect(validate('x'.repeat(61), ok, kindOf, nameOf)).toMatchObject({
      ok: false,
      message: 'Название — не длиннее 60 символов',
    })
    expect(validate(` ${'x'.repeat(60)} `, ok, kindOf, nameOf)).toMatchObject({ ok: true })
  })

  it('requires 1-40 exercises', () => {
    expect(validate('x', [], kindOf, nameOf)).toEqual({
      ok: false,
      message: 'Добавьте хотя бы одно упражнение',
      focus: 'add',
    })
    expect(validate('x', Array(40).fill(ok[0]), kindOf, nameOf).ok).toBe(true)
    expect(validate('x', Array(41).fill(ok[0]), kindOf, nameOf).ok).toBe(false)
  })

  it.each([
    [row('Squat', '0', '10', '90'), 'sets'],
    [row('Squat', '21', '10', '90'), 'sets'],
    [row('Squat', '2,5', '10', '90'), 'sets'],
    [row('Squat', '', '10', '90'), 'sets'],
    [row('Squat', '3', '201', '90'), 'amount'],
    [row('Plank', '3', '4', '30'), 'amount'],
    [row('Plank', '3', '7201', '30'), 'amount'],
    [row('Run', '1', '121', '60'), 'amount'],
    [row('Squat', '3', '10', '901'), 'rest'],
    [row('Squat', '3', '10', '-1'), 'rest'],
  ])('rejects %o in %s and points at the field', (bad, field) => {
    const result = validate('x', [ok[0], bad], kindOf, nameOf)

    expect(result).toMatchObject({ ok: false, focus: { row: 1, field } })
    expect(result.ok || result.message.startsWith(`«${bad.exerciseId}»: `)).toBe(true)
  })
})

describe('previewEntries', () => {
  it('counts unreadable fields as zero and skips unknown exercises', () => {
    expect(
      previewEntries([row('Squat', '', 'abc', '60'), row('Gone', '3', '10', '90')], kindOf),
    ).toEqual([{ exerciseId: 'Squat', sets: 0, reps: 0, restSec: 60 }])
  })
})
