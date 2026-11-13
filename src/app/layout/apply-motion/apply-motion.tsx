import { useEffect } from 'react'

import { useProfile } from '@/entities/profile'

export function ApplyMotion({ uid }: { uid: string }) {
  const { profile } = useProfile(uid)
  const off = profile?.animations === false

  useEffect(() => {
    document.documentElement.toggleAttribute('data-motion-off', off)

    return () => document.documentElement.removeAttribute('data-motion-off')
  }, [off])

  return null
}
