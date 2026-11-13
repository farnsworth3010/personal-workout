import { useSessionStore } from '@/entities/session'
import { resetProgress } from '@/entities/workout'
import { HoldButton, toast } from '@/shared/ui'

import { SettingsSection } from '../settings-section'

export function ResetSection({ uid }: { uid: string }) {
  // The running session lives in local storage, which resetProgress does not touch.
  const resetAll = () => {
    useSessionStore.getState().discard()
    resetProgress(uid)
    toast('Прогресс сброшен')
  }

  return (
    <SettingsSection
      id="h-reset"
      title="Сброс прогресса"
      className="mt-5 min-[900px]:col-start-1 min-[900px]:row-start-2"
    >
      <p id="reset-note" className="text-[13px] leading-[1.4] text-muted-foreground">
        Удалит все тренировки и статистику (историю, рекорды и графики), ваши наборы и расписание.
        Настройки останутся. Чтобы сбросить, удерживайте кнопку 10 секунд.
      </p>
      <HoldButton
        label="Сбросить прогресс"
        holdMs={10_000}
        holdAlways
        aria-describedby="reset-note"
        className="min-h-14 rounded-lg bg-danger px-10 text-[17px] font-bold text-on-danger uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[900px]:self-start"
        onConfirm={resetAll}
      />
    </SettingsSection>
  )
}
