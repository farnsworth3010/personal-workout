import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

import { toast } from '@/shared/ui'

/** Takes ?add=<exerciseId> from the catalog once and clears it from the URL. */
export function useAddParam() {
  const [params, setParams] = useSearchParams()
  const [addId] = useState(() => params.get('add'))

  // The appended exercise is part of the draft now; a reload must not add it again.
  useEffect(() => {
    if (addId) setParams({}, { replace: true })
  }, [addId, setParams])

  return addId
}

/** Says «Добавлено» once the editor shows the exercise; the ref outlives StrictMode's second run. */
export function useAddedToast(name: string | undefined) {
  const announced = useRef(false)

  useEffect(() => {
    if (!name || announced.current) return

    announced.current = true
    toast(`Добавлено: ${name}`)
  }, [name])
}
