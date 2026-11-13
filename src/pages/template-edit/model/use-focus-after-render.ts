import { useEffect, useRef } from 'react'

/** Refs for the row list and the add button, and a way to focus a control after the next change of trigger. */
export function useFocusAfterRender(trigger: unknown) {
  const list = useRef<HTMLOListElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<string | null>(null)

  // Focus moves after the re-render that placed the row, so the moved or next control exists.
  useEffect(() => {
    const selector = pendingFocus.current
    if (!selector) return

    pendingFocus.current = null
    const target = selector === 'add' ? addButton.current : list.current?.querySelector(selector)
    if (target instanceof HTMLElement) target.focus()
  }, [trigger])

  const focusAfterRender = (selector: string) => {
    pendingFocus.current = selector
  }

  return { listRef: list, addButtonRef: addButton, focusAfterRender }
}
