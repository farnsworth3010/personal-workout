import { useState } from 'react'
import { Smartphone, X } from 'lucide-react'

import { Button } from '@/shared/ui'

import { hideForGood, install } from '../../model/actions'
import { useInstall } from '../../model/install-store'
import { InstallSheet } from '../install-sheet'

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
