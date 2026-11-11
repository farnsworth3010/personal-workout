import { useSyncExternalStore } from 'react'

function subscribe(listener: () => void) {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)

  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

const isOnline = () => navigator.onLine

// In the flow, not fixed: it pushes the screen down instead of covering it (FR-046).
export function OfflineStrip() {
  const online = useSyncExternalStore(subscribe, isOnline)

  if (online) return null

  return (
    <div
      data-offline-strip
      role="status"
      className="border-b border-border bg-surface-2 px-4 pt-[calc(4px+env(safe-area-inset-top))] pb-1 text-center text-xs text-muted-foreground"
    >
      Офлайн · данные сохранятся и отправятся при подключении
    </div>
  )
}
