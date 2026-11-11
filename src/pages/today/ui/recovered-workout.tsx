import { useNavigate } from 'react-router'

import { useSessionStore } from '@/entities/session'
import { useActiveWorkout } from '@/entities/workout'
import { Button } from '@/shared/ui'

import { label, title2 } from './styles'

// A workout the server still holds as active while this device has none: storage was cleared,
// or it was started on another device. It can go on or straight to its summary.
export function RecoveredWorkout({ uid }: { uid: string }) {
  const navigate = useNavigate()
  const idle = useSessionStore((s) => s.workout === null)
  const doc = useActiveWorkout(uid)

  if (!idle || !doc) return null

  const { id, ...workout } = doc
  const restore = () => useSessionStore.getState().restore(id, workout)

  return (
    <section aria-labelledby="recovered-title" className="flex flex-col gap-3.5">
      <div>
        <p className={label}>Незавершённая тренировка</p>
        <h2 id="recovered-title" className={title2}>
          {workout.template.name}
        </h2>
      </div>
      <Button
        size="cta"
        onClick={() => {
          if (restore()) void navigate('/session')
        }}
      >
        Продолжить
      </Button>
      <Button
        variant="outline"
        size="ghost"
        onClick={() => {
          if (!restore()) return

          useSessionStore.getState().end()
          void navigate('/session/finish')
        }}
      >
        Завершить и перейти к итогам
      </Button>
    </section>
  )
}
