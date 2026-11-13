// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('place store', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('keeps the chosen place across reloads', async () => {
    const first = await import('./place')
    first.choosePlace('home')

    vi.resetModules()
    const reloaded = await import('./place')

    expect(reloaded.usePlaceStore.getState().place).toBe('home')
  })

  it('has no place until one is chosen', async () => {
    const { usePlaceStore } = await import('./place')

    expect(usePlaceStore.getState().place).toBeNull()
  })
})
