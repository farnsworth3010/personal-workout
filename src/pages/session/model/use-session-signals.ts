import { useEffect, useRef } from 'react'

import { playSignal, unlockAudio } from '@/shared/lib'
import { toast } from '@/shared/ui'

interface Signals {
  timeUp: boolean
  restOver: boolean
  restEndsAt: number | null
  soundsOn: boolean
  now: number
}

// The time-up and rest-end signals of a running session, and the audio unlock they need.
export function useSessionSignals({ timeUp, restOver, restEndsAt, soundsOn, now }: Signals) {
  const heardRestEnd = useRef<number | null>(null)

  // Audio starts only from a tap; any tap on the session may be the first one after a reload.
  useEffect(() => {
    document.addEventListener('pointerdown', unlockAudio)

    return () => document.removeEventListener('pointerdown', unlockAudio)
  }, [])

  useEffect(() => {
    if (!timeUp) return

    if (soundsOn) playSignal('countdown-end')
    if ('vibrate' in navigator) navigator.vibrate(300)
    toast('Время вышло')
  }, [timeUp, soundsOn])

  // A rest that ended while the app was hidden is signalled once on return; now re-runs it then.
  useEffect(() => {
    if (!restOver || document.visibilityState !== 'visible') return
    if (heardRestEnd.current === restEndsAt) return

    heardRestEnd.current = restEndsAt
    if (soundsOn) playSignal('rest-end')
  }, [restOver, restEndsAt, soundsOn, now])
}
