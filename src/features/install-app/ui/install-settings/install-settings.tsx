import { useState } from 'react'

import { Button, Heading } from '@/shared/ui'

import { useInstall } from '../../model/install-store'
import { InstallSheet } from '../install-sheet'

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
      <Heading id="h-install">Приложение</Heading>
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
