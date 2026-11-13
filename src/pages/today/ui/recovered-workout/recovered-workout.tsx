import { useNavigate } from 'react-router'

import { useSessionStore } from '@/entities/session'
import { useActiveWorkout } from '@/entities/workout'
import { Button, Title } from '@/shared/ui'

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
        <p className="mb-1.5 text-[13px] text-muted-foreground">Незавершённая тренировка</p>
        <Title as="h2" id="recovered-title" className="min-[900px]:text-[34px]">
          {workout.template.name}
        </Title>
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
