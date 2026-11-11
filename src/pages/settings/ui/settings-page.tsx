import { useState } from 'react'

import { equipmentLabels, equipmentList, type Equipment } from '@/entities/exercise'
import { defaultProfile, useProfile } from '@/entities/profile'
import { useSessionStore } from '@/entities/session'
import { resetProgress } from '@/entities/workout'
import { InstallSettings } from '@/features/install-app'
import { signOutUser, type AuthUser } from '@/shared/api'
import { cn } from '@/shared/lib'
import {
  Badge,
  Button,
  Chip,
  HoldButton,
  PageHeader,
  Sheet,
  SheetContent,
  Switch,
  toast,
  ValueStrip,
} from '@/shared/ui'

const section = 'flex flex-col gap-3 border-t border-border pt-5 pb-1'
const heading = 'text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase'
const note = 'text-[13px] leading-[1.4] text-muted-foreground'
const groupHead = 'text-[15px] font-semibold'

const formatRest = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

const weightSteps = [0.5, 1, 2.5, 5] as const

const toggles = [
  { key: 'sounds', label: 'Звуки', hint: 'Конец отдыха и таймера, подход и тренировка завершены' },
  { key: 'animations', label: 'Анимации', hint: 'Переходы между экранами и отклик кнопок' },
] as const

const timers = [
  { key: 'exercise', label: 'Время упражнения', hint: 'Сколько идёт текущий подход' },
  { key: 'rest', label: 'Отдых', hint: 'Обратный отсчёт между подходами' },
  { key: 'workout', label: 'Общее время тренировки', hint: 'С начала тренировки' },
] as const

// Body weight is always available, so it is shown checked and never stored.
const ALWAYS: Equipment = 'body only'

function EquipmentList({
  home,
  onChange,
}: {
  home: readonly Equipment[] | undefined
  onChange: (next: Equipment[]) => void
}) {
  const toggle = (item: Equipment, checked: boolean) => {
    if (!home) return

    onChange(equipmentList.filter((e) => e !== ALWAYS && (e === item ? checked : home.includes(e))))
  }

  return (
    <ul className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-x-6">
      {equipmentList.map((item) => {
        const fixed = item === ALWAYS

        return (
          <li
            key={item}
            className="border-b border-border first:border-t min-[900px]:nth-2:border-t"
          >
            <label className="grid min-h-13 cursor-pointer grid-cols-[1fr_auto] items-center gap-3 py-1.5 has-disabled:cursor-default">
              <span>
                {equipmentLabels[item]}
                {fixed && (
                  <small className="block text-xs text-muted-foreground">всегда доступно</small>
                )}
              </span>
              {/* The invisible input sits over the box, so a click on the box hits the input itself. */}
              <span className="relative">
                <input
                  type="checkbox"
                  className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
                  checked={fixed || (home?.includes(item) ?? false)}
                  disabled={fixed || !home}
                  onChange={(event) => toggle(item, event.target.checked)}
                />
                <i
                  aria-hidden="true"
                  className="grid size-[26px] place-items-center rounded-lg border-2 border-muted-foreground text-base font-extrabold text-transparent not-italic peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-55"
                >
                  ✓
                </i>
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

// settings.html.
export function SettingsPage({ user }: { user: AuthUser }) {
  const { profile, update } = useProfile(user.uid)
  const shown = profile ?? defaultProfile

  // The running session lives in local storage, which resetProgress does not touch.
  const resetAll = () => {
    useSessionStore.getState().discard()
    resetProgress(user.uid)
    toast('Прогресс сброшен')
  }
  const name = user.displayName ?? user.email ?? ''
  // Sign-out clears this device, so a running or unsaved workout would be lost without asking.
  const workoutName = useSessionStore((s) => s.workout?.template.name)
  const hasWorkout = workoutName !== undefined
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  return (
    <>
      <PageHeader title="Профиль" />

      <div className="min-w-0 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-x-12">
        <div className="min-w-0">
          <section aria-labelledby="h-account" className={section}>
            <h2 id="h-account" className={heading}>
              Аккаунт
            </h2>
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
          </section>
          <InstallSettings />
        </div>

        {/* Disables every control inside until the profile has loaded; role none keeps an unnamed group out of the tree. */}
        <fieldset
          role="none"
          disabled={!profile}
          className="mt-4 flex min-w-0 flex-col gap-4 min-[900px]:col-start-2 min-[900px]:row-span-3 min-[900px]:row-start-1 min-[900px]:mt-0"
        >
          <section aria-labelledby="h-defaults" className={section}>
            <h2 id="h-defaults" className={heading}>
              По умолчанию
            </h2>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between">
                <b className={groupHead}>Отдых между подходами</b>
                <span className={`${note} tabular-nums`}>{shown.defaultRestSec} с</span>
              </div>
              <ValueStrip
                label="Отдых между подходами"
                value={shown.defaultRestSec}
                min={15}
                max={300}
                step={15}
                integer
                format={formatRest}
                className="mt-2"
                onChange={(defaultRestSec) => update({ defaultRestSec })}
              />
              <p className="mt-1.5 text-center text-xs text-muted-foreground">
                листайте, чтобы найти значение
              </p>
            </div>
            <div>
              <b id="l-step" className={groupHead}>
                Шаг веса
              </b>
              <div role="group" aria-labelledby="l-step" className="mt-2 grid grid-cols-4 gap-1.5">
                {weightSteps.map((kg) => (
                  <Chip
                    key={kg}
                    pressed={shown.defaultWeightStepKg === kg}
                    className="min-h-13 text-[17px]"
                    onPressedChange={() => update({ defaultWeightStepKg: kg })}
                  >
                    {kg.toLocaleString('ru')} кг
                  </Chip>
                ))}
              </div>
              <p className={`${note} mt-2`}>
                Для отдельного упражнения шаг можно поменять в его карточке.
              </p>
            </div>
          </section>

          <section aria-labelledby="h-feedback" className={section}>
            <h2 id="h-feedback" className={heading}>
              Звуки и анимации
            </h2>
            <ul>
              {toggles.map(({ key, label, hint }) => (
                <li key={key} className="border-b border-border first:border-t">
                  <label
                    htmlFor={`toggle-${key}`}
                    className="grid min-h-16 cursor-pointer grid-cols-[1fr_auto] items-center gap-4 py-2.5"
                  >
                    <span>
                      {label}
                      <small className={`${note} mt-0.5 block`}>{hint}</small>
                    </span>
                    <Switch
                      id={`toggle-${key}`}
                      checked={shown[key]}
                      onCheckedChange={(checked) => update({ [key]: checked })}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="h-timers" className={section}>
            <h2 id="h-timers" className={heading}>
              Таймеры
            </h2>
            <ul>
              {timers.map(({ key, label, hint }) => (
                <li key={key} className="border-b border-border first:border-t">
                  <label
                    htmlFor={`timer-${key}`}
                    className="grid min-h-16 cursor-pointer grid-cols-[1fr_auto] items-center gap-4 py-2.5"
                  >
                    <span>
                      {label}
                      <small className={`${note} mt-0.5 block`}>{hint}</small>
                    </span>
                    <Switch
                      id={`timer-${key}`}
                      checked={shown.timers[key]}
                      onCheckedChange={(checked) => update({ timers: { [key]: checked } })}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </fieldset>

        <section aria-labelledby="h-gear" className={cn(section, 'mt-5 min-[900px]:col-start-2')}>
          <h2 id="h-gear" className={heading}>
            Моё оборудование дома
          </h2>
          <EquipmentList
            home={profile?.homeEquipment}
            onChange={(homeEquipment) => update({ homeEquipment })}
          />
          <p className={note}>
            Упражнения, для которых нужно что-то ещё, помечены <Badge>зал</Badge> и не попадают в
            домашние тренировки.
          </p>
        </section>

        {/* On desktop under the account, in the left column's free space, rather than below the fold. */}
        <section
          aria-labelledby="h-reset"
          className={cn(section, 'mt-5 min-[900px]:col-start-1 min-[900px]:row-start-2')}
        >
          <h2 id="h-reset" className={heading}>
            Сброс прогресса
          </h2>
          <p id="reset-note" className={note}>
            Удалит все тренировки и статистику (историю, рекорды и графики), ваши наборы и
            расписание. Настройки останутся. Чтобы сбросить, удерживайте кнопку 10 секунд.
          </p>
          <HoldButton
            label="Сбросить прогресс"
            holdMs={10_000}
            holdAlways
            aria-describedby="reset-note"
            className="min-h-14 rounded-lg bg-danger px-10 text-[17px] font-bold text-on-danger uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[900px]:self-start"
            onConfirm={resetAll}
          />
        </section>
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
    </>
  )
}
