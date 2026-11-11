import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useWakeLock } from './wake-lock'

const mockApi = (request = vi.fn()) => {
  const release = vi.fn().mockResolvedValue(undefined)

  request.mockResolvedValue({ release })
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })

  return { request, release }
}

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

// Lets the mocked request promise resolve.
const settle = () => new Promise((resolve) => setTimeout(resolve))

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
  Reflect.deleteProperty(document, 'visibilityState')
})

describe('useWakeLock', () => {
  it('takes the screen lock while active and releases it on leave', async () => {
    const { request, release } = mockApi()
    const { unmount } = renderHook(() => useWakeLock(true))

    expect(request).toHaveBeenCalledWith('screen')

    await settle()
    unmount()

    expect(release).toHaveBeenCalledOnce()
  })

  it('does nothing while inactive', () => {
    const { request } = mockApi()

    renderHook(() => useWakeLock(false))

    expect(request).not.toHaveBeenCalled()
  })

  it('releases when it turns inactive', async () => {
    const { release } = mockApi()
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    })

    await settle()
    rerender({ active: false })

    expect(release).toHaveBeenCalledOnce()
  })

  it('takes the lock again when the page becomes visible', () => {
    const { request } = mockApi()

    renderHook(() => useWakeLock(true))
    setVisibility('hidden')

    expect(request).toHaveBeenCalledTimes(1)

    setVisibility('visible')

    expect(request).toHaveBeenCalledTimes(2)
  })

  it('fails silently when the request is refused', async () => {
    const request = vi.fn()
    mockApi(request)
    request.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))

    const { unmount } = renderHook(() => useWakeLock(true))

    await settle()

    expect(() => unmount()).not.toThrow()
  })

  it('does nothing where the API is missing, as on plain http', () => {
    expect('wakeLock' in navigator).toBe(false)
    expect(() => renderHook(() => useWakeLock(true)).unmount()).not.toThrow()
  })
})
