import { Button, Sheet, SheetContent } from '@/shared/ui'

import { perks, subs } from '../../config/install'
import { hideForGood, install } from '../../model/actions'
import { setHint } from '../../model/install-store'
import type { InstallPlatform } from '../../model/platform'
import { InstallSteps } from '../install-steps'

// install.html: the steps for this browser, «Позже» keeps the Today card, «Не показывать» hides it.
export function InstallSheet({
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
        <InstallSteps
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
