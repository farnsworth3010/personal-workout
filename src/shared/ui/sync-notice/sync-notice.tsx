import { useEffect, useState } from 'react'
import { cn } from 'cn'

interface SyncNoticeProps {
  // Takes a listener, returns the unsubscribe: onWriteError of @/shared/api.
  subscribe: (listener: () => void) => () => void
}

// Offline writes wait in Firestore's queue; this appears only when the server rejected one.
function SyncNotice({ subscribe }: SyncNoticeProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => subscribe(() => setFailed(true)), [subscribe])

  if (!failed) return null

  return (
    <div
      role="alert"
      data-slot="sync-notice"
      className={cn(
        'fixed inset-x-4 top-[calc(12px+env(safe-area-inset-top))] z-[60] mx-auto flex max-w-[420px] items-center gap-3 rounded-lg border border-warn bg-surface-2 px-4 py-3 text-sm text-foreground',
        'min-[900px]:[body:has([data-app-nav])_&]:left-[calc(220px+16px)]',
      )}
    >
      <span className="flex-1">Не удалось сохранить изменения. Проверьте данные и повторите.</span>
      <button
        type="button"
        className="min-h-11 flex-none px-2 font-semibold text-muted-foreground"
        onClick={() => setFailed(false)}
      >
        Закрыть
      </button>
    </div>
  )
}

export { SyncNotice }
