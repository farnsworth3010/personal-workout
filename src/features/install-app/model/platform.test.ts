import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectPlatform, isStandalone } from './platform'

const ua = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  iphoneInstagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.40.92',
  // iPadOS Safari asks for desktop sites and reports a Mac.
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  ipadFirefox:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

describe('detectPlatform', () => {
  it.each([
    ['iPhone Safari', ua.iphoneSafari, 5, false, 'ios'],
    ['iPhone Chrome', ua.iphoneChrome, 5, false, 'ios-other'],
    ['an in-app browser on iPhone', ua.iphoneInstagram, 5, false, 'ios-other'],
    ['iPadOS Safari with a desktop user agent', ua.macSafari, 5, false, 'ios'],
    ['iPadOS Firefox with a desktop user agent', ua.ipadFirefox, 5, false, 'ios-other'],
    ['Android Chrome with the install prompt', ua.androidChrome, 5, true, 'android'],
    ['Android Chrome without the install prompt', ua.androidChrome, 5, false, 'android-menu'],
    ['Safari on a Mac without touch', ua.macSafari, 0, false, null],
    ['desktop Chrome, even with the install prompt', ua.windowsChrome, 0, true, null],
  ] as const)('%s → %s', (_name, userAgent, maxTouchPoints, canPrompt, platform) => {
    expect(detectPlatform({ userAgent, maxTouchPoints }, canPrompt)).toBe(platform)
  })
})

describe('isStandalone', () => {
  afterEach(() => vi.unstubAllGlobals())

  const displayMode = (mode: string | null) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === `(display-mode: ${mode})`,
    }))

  it('is true when opened from the home screen in standalone or fullscreen mode', () => {
    displayMode('standalone')
    expect(isStandalone()).toBe(true)

    displayMode('fullscreen')
    expect(isStandalone()).toBe(true)
  })

  it('is false in a browser tab', () => {
    displayMode(null)
    vi.stubGlobal('navigator', {})

    expect(isStandalone()).toBe(false)
  })

  it("falls back to iOS Safari's navigator.standalone without matchMedia", () => {
    vi.stubGlobal('matchMedia', undefined)
    vi.stubGlobal('navigator', { standalone: true })
    expect(isStandalone()).toBe(true)

    vi.stubGlobal('navigator', {})
    expect(isStandalone()).toBe(false)
  })
})
