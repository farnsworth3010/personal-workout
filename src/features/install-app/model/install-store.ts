import { useSyncExternalStore } from 'react'

import { detectPlatform, isStandalone } from './platform'

// Not in lib.dom: Chromium's event that lets the page show its own install button.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** new: the sheet opens on Today; later: a card on Today; never: nothing until Профиль. */
export type HintState = 'new' | 'later' | 'never'

const KEY = 'personal-workout:install-hint'

const readHint = (): HintState => {
  try {
    const value = localStorage.getItem(KEY)

    return value === 'later' || value === 'never' ? value : 'new'
  } catch {
    return 'new'
  }
}

let deferred: BeforeInstallPromptEvent | null = null
let snapshot = { hint: readHint(), canPrompt: false, installed: false }
const listeners = new Set<() => void>()

function set(next: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

/** Called once at startup: Chromium fires the event early, before lazy pages load. */
export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    set({ canPrompt: true })
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    set({ canPrompt: false, installed: true })
  })
}

export function setHint(hint: HintState) {
  // Per device on purpose: installing is about this browser, not the account.
  try {
    localStorage.setItem(KEY, hint)
  } catch {
    // Private mode: the choice lasts until reload.
  }

  set({ hint })
}

/** Shows the browser's own install dialog; the event can be used only once. */
export async function promptInstall() {
  const event = deferred
  if (!event) return false

  deferred = null
  set({ canPrompt: false })
  await event.prompt()

  const { outcome } = await event.userChoice
  if (outcome === 'accepted') set({ installed: true })

  return outcome === 'accepted'
}

export function useInstall() {
  const state = useSyncExternalStore(subscribe, () => snapshot)
  const platform =
    state.installed || isStandalone() ? null : detectPlatform(navigator, state.canPrompt)

  return { ...state, platform }
}
