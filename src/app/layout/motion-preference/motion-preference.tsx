import { useAuth } from '../../model/auth-context'
import { ApplyMotion } from '../apply-motion'

// The animations switch of the profile, applied to the whole document (motion.css).
export function MotionPreference() {
  const { user } = useAuth()

  return user && <ApplyMotion uid={user.uid} />
}
