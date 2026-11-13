import { useSyncExternalStore } from 'react'

/** Whether the media query matches now, re-rendering when it changes; false without a window. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query)
      list.addEventListener('change', onChange)

      return () => list.removeEventListener('change', onChange)
    },
    () => matchMedia(query).matches,
    () => false,
  )
}
