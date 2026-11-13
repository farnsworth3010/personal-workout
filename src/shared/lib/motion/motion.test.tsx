import { afterEach, describe, expect, it, vi } from 'vitest'

import { prefersStill } from './motion'

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-motion-off')
})

describe('prefersStill', () => {
  it('follows the system setting', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(prefersStill()).toBe(true)

    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(prefersStill()).toBe(false)
  })

  it('follows the profile switch when the system allows motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    document.documentElement.setAttribute('data-motion-off', '')

    expect(prefersStill()).toBe(true)
  })
})
