import { useState } from 'react'

import { useSessionStore } from '@/entities/session'
import { signOutUser, type AuthUser } from '@/shared/api'
import { Button, Sheet, SheetContent } from '@/shared/ui'

import { SettingsSection } from '../settings-section'

export function AccountSection({ user }: { user: AuthUser }) {
  const name = user.displayName ?? user.email ?? ''
  // Sign-out clears this device, so a running or unsaved workout would be lost without asking.
  const workoutName = useSessionStore((s) => s.workout?.template.name)
  const hasWorkout = workoutName !== undefined
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  return (
    <SettingsSection id="h-account" title="Аккаунт">
      <div className="grid grid-cols-[56px_1fr_auto] items-center gap-3.5">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-surface-2 text-[22px] font-extrabold uppercase"
        >
          {name[0]}
        </span>
        <div className="min-w-0">
          <b className="block text-[17px] [overflow-wrap:anywhere]">{name}</b>
          {/* Without a display name the email is already the name. */}
          {user.displayName && (
            <span className="text-sm [overflow-wrap:anywhere] text-muted-foreground">
              {user.email}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          className="h-auto min-h-11 rounded-lg px-4"
          onClick={() => (hasWorkout ? setConfirmSignOut(true) : signOutUser())}
        >
          Выйти
        </Button>
      </div>

      <Sheet open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <SheetContent
          title="Выйти из аккаунта?"
          description={`Тренировка «${workoutName ?? ''}» не сохранена и пропадёт с этого устройства.`}
        >
          <Button variant="destructive" size="cta" onClick={signOutUser}>
            Выйти
          </Button>
          <Button variant="outline" size="ghost" onClick={() => setConfirmSignOut(false)}>
            Отмена
          </Button>
        </SheetContent>
      </Sheet>
    </SettingsSection>
  )
}
