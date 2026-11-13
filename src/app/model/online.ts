export function subscribeOnline(listener: () => void) {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)

  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

export const isOnline = () => navigator.onLine
