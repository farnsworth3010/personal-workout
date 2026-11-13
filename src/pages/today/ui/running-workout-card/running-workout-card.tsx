import { Link } from 'react-router'

import { selectActive, selectFinishing, useSessionStore } from '@/entities/session'
import { Button, Title } from '@/shared/ui'

// The workout on this device: still running, or ended and waiting to be saved.
export function RunningWorkoutCard() {
  const active = useSessionStore(selectActive)
  const finishing = useSessionStore(selectFinishing)
  const running = useSessionStore((s) => s.workout?.template.name)

  if (!active && !finishing) return null

  return (
    <section aria-labelledby="running-title" className="flex flex-col gap-3.5">
      <div>
        <p className="mb-1.5 text-[13px] text-muted-foreground">
          {active ? 'Идёт тренировка' : 'Тренировка закончена, осталось сохранить'}
        </p>
        <Title as="h2" id="running-title" className="min-[900px]:text-[34px]">
          {running}
        </Title>
      </div>
      <Button asChild size="cta">
        <Link to={active ? '/session' : '/session/finish'}>
          {active ? 'Продолжить тренировку' : 'К итогам тренировки'}
        </Link>
      </Button>
    </section>
  )
}
