import { useEffect, useState } from 'react'
import { useLocation, useNavigation } from 'react-router'

import { skeletonFor } from '../routes/skeletons'

// The skeleton of the page being loaded; null on the first 120 ms, so a cached chunk shows no flash.
export function useRouteSkeleton() {
  const navigation = useNavigation()
  const { pathname } = useLocation()
  const target = navigation.state === 'loading' ? navigation.location.pathname : null
  const Skeleton = target && target !== pathname ? skeletonFor(target) : null
  const [lateFor, setLateFor] = useState<string | null>(null)

  useEffect(() => {
    if (!Skeleton) return

    const id = setTimeout(() => setLateFor(target), 120)
    return () => clearTimeout(id)
  }, [Skeleton, target])

  return lateFor === target ? Skeleton : null
}
