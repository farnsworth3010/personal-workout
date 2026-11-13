import { useEffect, useState } from 'react'

// Registered by hand: virtual:pwa-register needs workbox-window, which is not a dependency.
export function useWaitingWorker(): ServiceWorker | null {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    // No sw.js in dev; no navigator.serviceWorker outside secure contexts (plain-http demos).
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    let active = true

    // A waiting worker with a controller present is an update; the very first install never waits.
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        const offer = () => {
          if (active && registration.waiting && navigator.serviceWorker.controller) {
            setWaiting(registration.waiting)
          }
        }

        offer()
        registration.addEventListener('updatefound', () => {
          registration.installing?.addEventListener('statechange', offer)
        })
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  return waiting
}

// True once a new worker takes over, from this tab's «Обновить» or another tab's.
export function useWorkerSwapped() {
  const [swapped, setSwapped] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const sw = navigator.serviceWorker
    // The very first install takes control without a previous worker: nothing to reload for.
    let controlled = sw.controller !== null
    const onChange = () => {
      if (controlled) setSwapped(true)
      controlled = true
    }

    sw.addEventListener('controllerchange', onChange)

    return () => sw.removeEventListener('controllerchange', onChange)
  }, [])

  return swapped
}

export function update(worker: ServiceWorker) {
  // The generated sw.js calls skipWaiting() on this message.
  worker.postMessage({ type: 'SKIP_WAITING' })
}
