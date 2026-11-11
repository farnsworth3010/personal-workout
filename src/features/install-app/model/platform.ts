export type InstallPlatform = 'ios' | 'ios-other' | 'android' | 'android-menu'

// iOS browsers other than Safari name themselves in the user agent; in-app browsers too.
const IOS_OTHER =
  /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|GSA\/|DuckDuckGo|FBAN|FBAV|Instagram|Line\//

/** How the app can be installed here, or null on a desktop. */
export function detectPlatform(
  nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>,
  canPrompt: boolean,
): InstallPlatform | null {
  const ua = nav.userAgent
  // iPadOS reports a Mac user agent; only touch tells them apart.
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && nav.maxTouchPoints > 1)

  if (ios) return IOS_OTHER.test(ua) ? 'ios-other' : 'ios'

  if (ua.includes('Android')) return canPrompt ? 'android' : 'android-menu'

  return null
}

/** Opened from the home screen icon rather than in a browser tab. */
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as { standalone?: boolean }).standalone === true
