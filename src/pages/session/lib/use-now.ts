import { useEffect, useState } from 'react'

// Re-renders every second; timers derive their values from timestamps and this clock.
export function useNow() {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 1000)

    // Timers are suspended in the background; catch up at once on return.
    document.addEventListener('visibilitychange', tick)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  return now
}
