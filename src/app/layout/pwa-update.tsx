import { useEffect, useState } from 'react'

import { selectActive, useSessionStore } from '@/entities/session'
import { Button } from '@/shared/ui'

import { useAuth } from './auth-context'

// Without it the browser may evict the Firestore cache, and with it unsynced workouts.
function persistStorage() {
  // navigator.storage exists only in secure contexts, so plain-http demos skip this silently.
  const storage = navigator.storage as StorageManager | undefined

  void storage
    ?.persisted()
    .then((persisted) => persisted || storage.persist())
    .catch(() => undefined)
}

// Registered by hand: virtual:pwa-register needs workbox-window, which is not a dependency.
function useWaitingWorker(): ServiceWorker | null {
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

function update(worker: ServiceWorker) {
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
    once: true,
  })

  // The generated sw.js calls skipWaiting() on this message.
  worker.postMessage({ type: 'SKIP_WAITING' })
}

// The service worker update offer; reloading mid-workout would swap the app under the session.
export function PwaUpdate() {
  const waiting = useWaitingWorker()
  const [dismissed, setDismissed] = useState<ServiceWorker | null>(null)
  const active = useSessionStore(selectActive)
  const signedIn = useAuth().status === 'signedIn'

  useEffect(() => {
    if (signedIn) persistStorage()
  }, [signedIn])

  if (!waiting || waiting === dismissed || active) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-3 z-[60] mx-auto flex max-w-[420px] items-center gap-2 rounded-lg border border-border bg-surface-2 py-2 pr-2 pl-4 text-sm text-foreground max-[900px]:top-[calc(env(safe-area-inset-top)+16px)]"
    >
      <span className="flex-1">Доступна новая версия</span>
      <Button variant="ghost" className="min-h-11" onClick={() => setDismissed(waiting)}>
        Позже
      </Button>
      <Button className="min-h-11" onClick={() => update(waiting)}>
        Обновить
      </Button>
    </div>
  )
}
