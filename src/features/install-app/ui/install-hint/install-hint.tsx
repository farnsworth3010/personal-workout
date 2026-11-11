import { useState, type ReactNode } from 'react'
import {
  Compass,
  Ellipsis,
  EllipsisVertical,
  Maximize,
  Share,
  Smartphone,
  SquarePlus,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { Button, Sheet, SheetContent, toast } from '@/shared/ui'

import { promptInstall, setHint, useInstall } from '../../model/install-store'
import type { InstallPlatform } from '../../model/platform'

// The browser's own control drawn inline, so a step reads like the screen it points at.
function Key({ icon: Icon, children }: { icon: LucideIcon; children?: ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-0.5 align-[1px] font-semibold whitespace-nowrap">
      <Icon aria-hidden className="size-4 text-primary" />
      {children}
    </span>
  )
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="flex flex-col [counter-reset:step]">{children}</ol>
}

function Step({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 border-b border-border py-2.5 text-[15px] leading-[1.45] [counter-increment:step] before:grid before:size-7 before:place-items-center before:rounded-full before:border before:border-primary before:text-[13px] before:font-bold before:text-primary before:content-[counter(step)] first:border-t">
      <div>
        {children}
        {hint && <small className="mt-0.5 block text-[13px] text-muted-foreground">{hint}</small>}
      </div>
    </li>
  )
}

const subs: Record<InstallPlatform, string> = {
  ios: 'В Safari это делается через меню «Поделиться» — займёт десять секунд.',
  'ios-other': 'На iPhone установить можно из Safari или из меню «Поделиться» вашего браузера.',
  android: 'Chrome установит приложение одним нажатием.',
  'android-menu': 'Кнопка установки сейчас недоступна — это делается через меню браузера.',
}

const perks: [LucideIcon, string][] = [
  [Maximize, 'На весь экран, без панели браузера'],
  [Wifi, 'Тренировка идёт и без сети'],
  [Zap, 'Открывается с экрана «Домой»'],
]

async function install() {
  if (await promptInstall()) toast('Приложение установлено')
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.origin)
    toast('Ссылка скопирована — вставьте её в Safari')
  } catch {
    toast('Не удалось скопировать ссылку')
  }
}

function How({ platform, onInstall }: { platform: InstallPlatform; onInstall: () => void }) {
  switch (platform) {
    case 'ios':
      return (
        <Steps>
          <Step
            hint={
              <>
                На панели Safari внизу; если её не видно — <Key icon={Ellipsis} /> справа от адреса
              </>
            }
          >
            Нажмите <Key icon={Share}>Поделиться</Key>
          </Step>
          <Step hint="Если пункта нет в списке, прокрутите его вниз">
            Выберите <Key icon={SquarePlus}>На экран «Домой»</Key>
          </Step>
          <Step hint="Значок появится на экране «Домой»">Нажмите «Добавить» справа вверху</Step>
        </Steps>
      )
    case 'ios-other':
      return (
        <>
          <Steps>
            <Step hint="В других браузерах — в их меню, если там есть этот пункт">
              В Chrome: <Key icon={Share}>Поделиться</Key> в адресной строке
            </Step>
            <Step
              hint={
                <>
                  Нет такого пункта — откройте ссылку в <Key icon={Compass}>Safari</Key>
                </>
              }
            >
              Выберите <Key icon={SquarePlus}>На экран «Домой»</Key>
            </Step>
          </Steps>
          <Button
            variant="outline"
            className="h-auto min-h-12 rounded-lg"
            onClick={() => void copyLink()}
          >
            Скопировать ссылку для Safari
          </Button>
        </>
      )
    case 'android':
      return (
        <Button
          className="h-auto min-h-16 gap-2.5 rounded-lg text-lg font-bold text-on-accent uppercase"
          onClick={onInstall}
        >
          <Smartphone aria-hidden className="size-5" />
          Установить
        </Button>
      )
    case 'android-menu':
      return (
        <Steps>
          <Step>
            Откройте меню <Key icon={EllipsisVertical} /> справа вверху
          </Step>
          <Step hint="Или «Добавить на главный экран» в старых версиях">
            Выберите <Key icon={Smartphone}>Установить приложение</Key>
          </Step>
          <Step>Подтвердите «Установить»</Step>
        </Steps>
      )
  }
}

function hideForGood() {
  setHint('never')
  toast('Подсказка скрыта. Вернуть — в Профиле')
}

// install.html: the steps for this browser, «Позже» keeps the Today card, «Не показывать» hides it.
function InstallSheet({
  platform,
  open,
  onOpenChange,
}: {
  platform: InstallPlatform
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const close = (hint: 'later' | 'never') => {
    onOpenChange(false)

    if (hint === 'never') hideForGood()
    else setHint('later')
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close('later'))}>
      <SheetContent title="Установите приложение" description={subs[platform]} className="gap-3.5">
        <ul className="grid grid-cols-3 border-y border-border">
          {perks.map(([Icon, text]) => (
            <li
              key={text}
              className="flex flex-col gap-1.5 py-3 pr-2 text-[13px] leading-[1.3] text-muted-foreground"
            >
              <Icon aria-hidden className="size-5 text-primary" />
              {text}
            </li>
          ))}
        </ul>
        <How
          platform={platform}
          onInstall={() => {
            close('later')
            void install()
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-auto min-h-12 rounded-lg"
            onClick={() => close('later')}
          >
            Позже
          </Button>
          <Button
            variant="outline"
            className="h-auto min-h-12 rounded-lg"
            onClick={() => close('never')}
          >
            Не показывать
          </Button>
        </div>
        <p className="text-[13px] leading-[1.4] text-muted-foreground">
          Подсказка вернётся карточкой на «Сегодня». Убрать её насовсем — «Не показывать».
        </p>
      </SheetContent>
    </Sheet>
  )
}

/** On Today, in a phone browser: the sheet on the first visit, then a compact card. */
export function InstallHint() {
  const { platform, hint } = useInstall()
  const [open, setOpen] = useState(hint === 'new')

  if (!platform || hint === 'never') return null

  return (
    <>
      {hint === 'later' && (
        <section
          aria-label="Установка приложения"
          className="grid grid-cols-[40px_minmax(0,1fr)_auto_44px] items-center gap-2.5 rounded-lg border border-border bg-surface py-2 pl-3"
        >
          <span className="grid size-10 place-items-center rounded-[10px] bg-primary text-on-accent">
            <Smartphone aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <b className="block text-[15px] font-semibold">На экран «Домой»</b>
            <small className="mt-0.5 block text-[13px] text-muted-foreground">
              Работает без сети
            </small>
          </div>
          <Button
            variant="outline"
            className="h-auto min-h-11 rounded-lg border-primary px-3.5 font-bold text-primary"
            onClick={() => (platform === 'android' ? void install() : setOpen(true))}
          >
            {platform === 'android' ? 'Установить' : 'Как'}
          </Button>
          <button
            type="button"
            aria-label="Не показывать"
            className="grid size-11 place-items-center text-muted-foreground"
            onClick={hideForGood}
          >
            <X aria-hidden className="size-5" />
          </button>
        </section>
      )}
      <InstallSheet platform={platform} open={open} onOpenChange={setOpen} />
    </>
  )
}

/** In Профиль: brings the instructions back, also after «Не показывать». */
export function InstallSettings() {
  const { platform } = useInstall()
  const [open, setOpen] = useState(false)

  if (!platform) return null

  return (
    <section
      aria-labelledby="h-install"
      className="flex flex-col gap-3 border-t border-border pt-5 pb-1"
    >
      <h2
        id="h-install"
        className="text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase"
      >
        Приложение
      </h2>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <p className="text-[13px] leading-[1.4] text-muted-foreground">
          Установите на экран «Домой»: на весь экран и без сети.
        </p>
        <Button
          variant="outline"
          className="h-auto min-h-11 rounded-lg px-4"
          onClick={() => setOpen(true)}
        >
          Как установить
        </Button>
      </div>
      <InstallSheet platform={platform} open={open} onOpenChange={setOpen} />
    </section>
  )
}
