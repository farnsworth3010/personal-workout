import { describe, expect, it, vi } from 'vitest'

import { newId } from './id'

describe('newId', () => {
  it('makes distinct 20-character ids without crypto.randomUUID, as on a plain http origin', () => {
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('insecure context')
    })

    const ids = new Set(Array.from({ length: 100 }, newId))

    expect(ids.size).toBe(100)
    for (const id of ids) expect(id).toMatch(/^[\w-]{20}$/)
    vi.restoreAllMocks()
  })
})
