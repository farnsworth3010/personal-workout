import { Link, useNavigate } from 'react-router'

import { selectActive, useSessionStore } from '@/entities/session'
import { Button, Sheet, SheetContent } from '@/shared/ui'

// Shown instead of a start while a workout runs or waits on the finish screen.
export function RunningWorkoutSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const active = useSessionStore(selectActive)
  const name = useSessionStore((s) => s.workout?.template.name) ?? ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={active ? 'Уже идёт тренировка' : 'Тренировка не сохранена'}
        description={
          active
            ? `Сначала продолжите или завершите «${name}».`
            : `Сначала сохраните итоги «${name}».`
        }
      >
        {active ? (
          <>
            <Button asChild size="cta">
              <Link to="/session">Продолжить</Link>
            </Button>
            <Button
              variant="outline"
              size="ghost"
              onClick={() => {
                useSessionStore.getState().end()
                void navigate('/session/finish')
              }}
            >
              Завершить и перейти к итогам
            </Button>
          </>
        ) : (
          <Button asChild size="cta">
            <Link to="/session/finish">К итогам тренировки</Link>
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
