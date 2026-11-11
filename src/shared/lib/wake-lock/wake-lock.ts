import { useEffect } from 'react'

// Keeps the screen on while active. The API is missing on plain http and in some browsers,
// and a request can be refused (battery saver), so every failure is silent.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | undefined
    let left = false

    const request = () => {
      if (document.visibilityState !== 'visible') return

      navigator.wakeLock.request('screen').then(
        (sentinel) => {
          if (left) void sentinel.release().catch(() => undefined)
          else lock = sentinel
        },
        () => undefined,
      )
    }

    // The browser drops the lock when the page is hidden; it has to be taken again on return.
    document.addEventListener('visibilitychange', request)
    request()

    return () => {
      left = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release().catch(() => undefined)
    }
  }, [active])
}
