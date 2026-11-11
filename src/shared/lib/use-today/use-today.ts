import { useEffect, useState } from 'react'

import { addDays, sameDay, startOfDay } from '../date'

/** The current moment, renewed when the day changes: a PWA resumed in the morning must not show yesterday. */
export function useToday() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const check = () => {
      const current = new Date()
      setNow((previous) => (sameDay(previous, current) ? previous : current))
    }
    const untilMidnight = () => addDays(startOfDay(new Date()), 1).getTime() - Date.now()

    // Background tabs throttle timers, so returning to the app checks too.
    let timer = setTimeout(function tick() {
      check()
      timer = setTimeout(tick, untilMidnight())
    }, untilMidnight())
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  return now
}
