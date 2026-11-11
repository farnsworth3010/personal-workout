import { describe, expect, it } from 'vitest'

import { diffManifest, formatManifest, parseManifest } from './manifest.ts'

const a = 'a'.repeat(64)
const b = 'b'.repeat(64)

describe('manifest', () => {
  it('round-trips the sorted sha256sum format', () => {
    const text = formatManifest(
      new Map([
        ['exercises/b.json', b],
        ['dist/exercises.json', a],
      ]),
    )

    expect(text).toBe(`${a}  dist/exercises.json\n${b}  exercises/b.json\n`)
    expect(parseManifest(text)).toEqual(
      new Map([
        ['dist/exercises.json', a],
        ['exercises/b.json', b],
      ]),
    )
  })

  it('rejects a malformed line', () => {
    expect(() => parseManifest('nothex  file\n')).toThrow('Bad manifest line')
  })

  it('lists mismatched, missing and extra files', () => {
    const expected = new Map([
      ['same', a],
      ['changed', a],
      ['gone', a],
    ])
    const actual = new Map([
      ['same', a],
      ['changed', b],
      ['new', a],
    ])

    expect(diffManifest(expected, actual)).toEqual([
      'mismatch changed',
      'missing  gone',
      'extra    new',
    ])
  })
})
