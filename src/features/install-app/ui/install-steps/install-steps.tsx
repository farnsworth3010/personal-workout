import { Compass, Ellipsis, EllipsisVertical, Share, Smartphone, SquarePlus } from 'lucide-react'

import { Button } from '@/shared/ui'

import { copyLink } from '../../model/actions'
import type { InstallPlatform } from '../../model/platform'
import { KeyChip } from '../key-chip'
import { Step } from '../step'
import { StepList } from '../step-list'

export function InstallSteps({
  platform,
  onInstall,
}: {
  platform: InstallPlatform
  onInstall: () => void
}) {
  switch (platform) {
    case 'ios':
      return (
        <StepList>
          <Step
            hint={
              <>
                На панели Safari внизу; если её не видно — <KeyChip icon={Ellipsis} /> справа от
                адреса
              </>
            }
          >
            Нажмите <KeyChip icon={Share}>Поделиться</KeyChip>
          </Step>
          <Step hint="Если пункта нет в списке, прокрутите его вниз">
            Выберите <KeyChip icon={SquarePlus}>На экран «Домой»</KeyChip>
          </Step>
          <Step hint="Значок появится на экране «Домой»">Нажмите «Добавить» справа вверху</Step>
        </StepList>
      )
    case 'ios-other':
      return (
        <>
          <StepList>
            <Step hint="В других браузерах — в их меню, если там есть этот пункт">
              В Chrome: <KeyChip icon={Share}>Поделиться</KeyChip> в адресной строке
            </Step>
            <Step
              hint={
                <>
                  Нет такого пункта — откройте ссылку в <KeyChip icon={Compass}>Safari</KeyChip>
                </>
              }
            >
              Выберите <KeyChip icon={SquarePlus}>На экран «Домой»</KeyChip>
            </Step>
          </StepList>
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
        <StepList>
          <Step>
            Откройте меню <KeyChip icon={EllipsisVertical} /> справа вверху
          </Step>
          <Step hint="Или «Добавить на главный экран» в старых версиях">
            Выберите <KeyChip icon={Smartphone}>Установить приложение</KeyChip>
          </Step>
          <Step>Подтвердите «Установить»</Step>
        </StepList>
      )
  }
}
