import { useSyncExternalStore } from 'react'
import { cn } from 'cn'

const DURATION_MS = 2000

let state = { text: '', open: false }
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function set(next: typeof state) {
  state = next
  listeners.forEach((listener) => listener())
}

// Usable outside React; a new message replaces the one on screen (a queue of one).
function toast(text: string) {
  clearTimeout(timer)
  set({ text, open: true })

  timer = setTimeout(() => set({ ...state, open: false }), DURATION_MS)
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

const getState = () => state

// Mount once. It sits above the bottom bar (and a [data-save-bar]) or beside the sidebar when the page has [data-app-nav].
function Toaster() {
  const { text, open } = useSyncExternalStore(subscribe, getState)

  return (
    <div
      role="status"
      data-slot="toast"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'pointer-events-none fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 z-[60] w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-lg border border-border bg-surface-2 px-[18px] py-3 text-sm text-foreground transition-[opacity,translate,visibility] duration-200',
        open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0',
        '[body:has([data-app-nav])_&]:bottom-[calc(72px+env(safe-area-inset-bottom))]',
        'min-[900px]:[body:has([data-app-nav])_&]:bottom-6 min-[900px]:[body:has([data-app-nav])_&]:left-[calc(50%+110px)]',
        // Above the template editor's fixed save bar on phones.
        'max-[900px]:[body:has([data-save-bar])_&]:bottom-[calc(140px+env(safe-area-inset-bottom))]',
      )}
    >
      {text}
    </div>
  )
}

export { toast, Toaster }
