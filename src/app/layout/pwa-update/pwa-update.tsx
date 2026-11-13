import { useEffect, useState } from 'react'

import { selectActive, useSessionStore } from '@/entities/session'
import { Button } from '@/shared/ui'

import { persistStorage } from '../../lib/persist-storage'
import { useAuth } from '../../model/auth-context'
import { update, useWaitingWorker, useWorkerSwapped } from '../../model/service-worker'

// The service worker update offer; reloading mid-workout would swap the app under the session.
export function PwaUpdate() {
  const waiting = useWaitingWorker()
  const [dismissed, setDismissed] = useState<ServiceWorker | null>(null)
  const active = useSessionStore(selectActive)
  const signedIn = useAuth().status === 'signedIn'
  const swapped = useWorkerSwapped()

  // The old chunks are gone with the old worker, so the tab reloads, but never under a running
  // workout: then it waits until the workout ends (the session itself survives a reload).
  useEffect(() => {
    if (swapped && !active) location.reload()
  }, [swapped, active])

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
