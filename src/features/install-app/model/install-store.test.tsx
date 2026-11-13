import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'personal-workout:install-hint'

const android =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'

// The store keeps module state and reads the stored hint on import, so each test loads it afresh.
async function load(stored?: string) {
  if (stored !== undefined) localStorage.setItem(KEY, stored)
  vi.resetModules()
  const store = await import('./install-store')
  store.listenForInstallPrompt()

  return { ...store, view: renderHook(() => store.useInstall()).result }
}

function installPrompt(outcome: 'accepted' | 'dismissed') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  })

  act(() => {
    window.dispatchEvent(event)
  })

  return event
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(android)
})

afterEach(() => vi.restoreAllMocks())

describe('install hint', () => {
  it.each([
    [undefined, 'new'],
    ['later', 'later'],
    ['never', 'never'],
    ['something else', 'new'],
  ])('starts from the stored value %s as %s', async (stored, hint) => {
    const { view } = await load(stored)

    expect(view.current.hint).toBe(hint)
  })

  it('stores a choice per device and re-renders its readers', async () => {
    const { setHint, view } = await load()

    act(() => setHint('later'))

    expect(view.current.hint).toBe('later')
    expect(localStorage.getItem(KEY)).toBe('later')
  })

  it('keeps a choice until reload when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('private mode')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private mode')
    })
    const { setHint, view } = await load()
    expect(view.current.hint).toBe('new')

    act(() => setHint('never'))

    expect(view.current.hint).toBe('never')
  })
})

describe('install prompt', () => {
  it('offers the install button on Android once the browser hands over its prompt', async () => {
    const { view } = await load()
    expect(view.current.platform).toBe('android-menu')

    const event = installPrompt('accepted')

    expect(event.defaultPrevented).toBe(true)
    expect(view.current).toMatchObject({ canPrompt: true, platform: 'android' })
  })

  it('shows the browser dialog once and hides the hint after an accepted install', async () => {
    const { promptInstall, view } = await load()
    const event = installPrompt('accepted')

    let accepted = false
    await act(async () => {
      accepted = await promptInstall()
    })

    expect(accepted).toBe(true)
    expect(event.prompt).toHaveBeenCalledOnce()
    expect(view.current).toMatchObject({ installed: true, canPrompt: false, platform: null })
    expect(await promptInstall()).toBe(false)
    expect(event.prompt).toHaveBeenCalledOnce()
  })

  it('falls back to the menu steps after a dismissed dialog', async () => {
    const { promptInstall, view } = await load()
    installPrompt('dismissed')

    let accepted = true
    await act(async () => {
      accepted = await promptInstall()
    })

    expect(accepted).toBe(false)
    expect(view.current).toMatchObject({
      installed: false,
      canPrompt: false,
      platform: 'android-menu',
    })
  })

  it('does nothing without a prompt event', async () => {
    const { promptInstall } = await load()

    expect(await promptInstall()).toBe(false)
  })

  it('hides the hint once the app is installed from the browser menu', async () => {
    const { view } = await load()
    installPrompt('accepted')

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(view.current).toMatchObject({ installed: true, canPrompt: false, platform: null })
  })

  it('shows nothing on a desktop browser', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    )
    const { view } = await load()
    installPrompt('accepted')

    expect(view.current.platform).toBeNull()
  })
})
