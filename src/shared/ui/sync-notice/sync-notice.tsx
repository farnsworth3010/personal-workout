import { useEffect, useState } from 'react'
import { cn } from 'cn'

interface SyncNoticeProps {
  // Takes a listener, returns the unsubscribe: onWriteError of @/shared/api (label: its WriteLabel).
  subscribe: (listener: (error: unknown, label?: string) => void) => () => void
}

const fallback = 'Не удалось сохранить изменения. Проверьте данные и повторите.'

// Keyed by WriteLabel; a rejected finish leaves the server copy active, which «Сегодня» offers to continue.
const messages: Record<string, string> = {
  workout: 'Не удалось сохранить тренировку на сервере. Она остаётся на этом устройстве.',
  finish: 'Тренировка не сохранилась. Продолжите её на экране «Сегодня» и завершите снова.',
  stats: 'Не удалось обновить рекорды упражнений.',
  profile: 'Не удалось сохранить настройки. Повторите изменение.',
  template: 'Не удалось сохранить набор. Повторите изменение.',
  reset: 'Не удалось сбросить прогресс. Повторите.',
}

// Offline writes wait in Firestore's queue; this appears only when the server rejected one.
function SyncNotice({ subscribe }: SyncNoticeProps) {
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(
    () =>
      subscribe((_error, label) => {
        setFailed((label && messages[label]) ?? fallback)
      }),
    [subscribe],
  )

  if (failed === null) return null

  return (
    <div
      role="alert"
      data-slot="sync-notice"
      className={cn(
        'fixed inset-x-4 top-3 z-[60] mx-auto flex max-w-[420px] items-center gap-3 rounded-lg border border-warn bg-surface-2 px-4 py-3 text-sm text-foreground max-[900px]:top-[calc(env(safe-area-inset-top)+16px)]',
        'min-[900px]:[body:has([data-app-nav])_&]:left-[calc(220px+16px)]',
      )}
    >
      <span className="flex-1">{failed}</span>
      <button
        type="button"
        className="min-h-11 flex-none px-2 font-semibold text-muted-foreground"
        onClick={() => setFailed(null)}
      >
        Закрыть
      </button>
    </div>
  )
}

export { SyncNotice }
