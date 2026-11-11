import { useEffect } from 'react'

import { useProfile } from '@/entities/profile'

import { useAuth } from './auth-context'

// The animations switch of the profile, applied to the whole document (motion.css).
export function MotionPreference() {
  const { user } = useAuth()

  return user && <ApplyMotion uid={user.uid} />
}

function ApplyMotion({ uid }: { uid: string }) {
  const { profile } = useProfile(uid)
  const off = profile?.animations === false

  useEffect(() => {
    document.documentElement.toggleAttribute('data-motion-off', off)

    return () => document.documentElement.removeAttribute('data-motion-off')
  }, [off])

  return null
}
