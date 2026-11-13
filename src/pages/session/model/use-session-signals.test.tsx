import { fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionSignals } from './use-session-signals'

const mocks = vi.hoisted(() => ({
  playSignal: vi.fn(),
  unlockAudio: vi.fn(),
  toast: vi.fn(),
  vibrate: vi.fn(),
}))

vi.mock('@/shared/lib', async (original) => ({
  ...(await original<typeof import('@/shared/lib')>()),
  playSignal: mocks.playSignal,
  unlockAudio: mocks.unlockAudio,
}))

vi.mock('@/shared/ui', () => ({ toast: mocks.toast }))

type Signals = Parameters<typeof useSessionSignals>[0]

const quiet: Signals = { timeUp: false, restOver: false, restEndsAt: null, soundsOn: true, now: 0 }

const render = (props: Signals) =>
  renderHook((p: Signals) => useSessionSignals(p), { initialProps: props })

const setVisibility = (state: DocumentVisibilityState) =>
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })

const played = () => mocks.playSignal.mock.calls.map(([signal]) => signal as string)

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'vibrate', { value: mocks.vibrate, configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(document, 'visibilityState')
  Reflect.deleteProperty(navigator, 'vibrate')
})

describe('useSessionSignals', () => {
  it('signals the end of a timed set with a sound, a vibration and a toast', () => {
    const { rerender } = render(quiet)

    rerender({ ...quiet, timeUp: true, now: 1000 })

    expect(played()).toEqual(['countdown-end'])
    expect(mocks.vibrate).toHaveBeenCalledWith(300)
    expect(mocks.toast).toHaveBeenCalledWith('Время вышло')
  })

  it('keeps the vibration and the toast with sounds off', () => {
    render({ ...quiet, timeUp: true, soundsOn: false })

    expect(played()).toEqual([])
    expect(mocks.vibrate).toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith('Время вышло')
  })

  it('signals each rest end once while the clock ticks', () => {
    const { rerender } = render({ ...quiet, restOver: true, restEndsAt: 90_000, now: 90_000 })

    rerender({ ...quiet, restOver: true, restEndsAt: 90_000, now: 91_000 })
    rerender({ ...quiet, restOver: true, restEndsAt: 90_000, now: 92_000 })

    expect(played()).toEqual(['rest-end'])

    rerender({ ...quiet, restOver: true, restEndsAt: 200_000, now: 200_000 })

    expect(played()).toEqual(['rest-end', 'rest-end'])
  })

  it('waits for the return to a hidden tab, then signals once', () => {
    setVisibility('hidden')
    const { rerender } = render({ ...quiet, restOver: true, restEndsAt: 90_000, now: 95_000 })

    expect(played()).toEqual([])

    setVisibility('visible')
    rerender({ ...quiet, restOver: true, restEndsAt: 90_000, now: 300_000 })
    rerender({ ...quiet, restOver: true, restEndsAt: 90_000, now: 301_000 })

    expect(played()).toEqual(['rest-end'])
  })

  it('stays silent about a rest end with sounds off', () => {
    render({ ...quiet, restOver: true, restEndsAt: 90_000, soundsOn: false })

    expect(played()).toEqual([])
  })

  it('unlocks audio on a tap until unmounted', () => {
    const { unmount } = render(quiet)

    fireEvent.pointerDown(document.body)
    expect(mocks.unlockAudio).toHaveBeenCalledTimes(1)

    unmount()
    fireEvent.pointerDown(document.body)
    expect(mocks.unlockAudio).toHaveBeenCalledTimes(1)
  })
})
