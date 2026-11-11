import { afterEach, describe, expect, it, vi } from 'vitest'

import { fireWrite, onWriteError } from './write'

describe('fireWrite', () => {
  const unsubscribes: (() => void)[] = []

  afterEach(() => {
    unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe())
  })

  it('returns synchronously without the server promise', () => {
    const neverAcked = new Promise<void>(() => undefined)
    const write = vi.fn(() => neverAcked)

    // Typed as returning unknown so the assertion would catch a leaked promise.
    const call: (w: typeof write) => unknown = fireWrite

    expect(call(write)).toBeUndefined()
    expect(write).toHaveBeenCalledOnce()
  })

  it('reports a rejected write to every listener', async () => {
    const first = vi.fn()
    const second = vi.fn()
    unsubscribes.push(onWriteError(first), onWriteError(second))
    const error = new Error('permission-denied')

    fireWrite(() => Promise.reject(error), 'finish')

    await vi.waitFor(() => {
      expect(first).toHaveBeenCalledWith(error, 'finish')
    })
    expect(second).toHaveBeenCalledWith(error, 'finish')
  })

  it('reports a write that throws before it starts', () => {
    const listener = vi.fn()
    unsubscribes.push(onWriteError(listener))
    const error = new Error('invalid document')

    fireWrite(() => {
      throw error
    })

    expect(listener).toHaveBeenCalledWith(error, 'other')
  })

  it('stops notifying a listener after it unsubscribes', async () => {
    const listener = vi.fn()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    onWriteError(listener)()

    fireWrite(() => Promise.reject(new Error('x')))

    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalled()
    })
    expect(listener).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
