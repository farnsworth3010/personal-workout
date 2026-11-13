import type { ProfilePatch } from '@/entities/profile'
import type { Profile } from '@/shared/api'
import { formatDuration } from '@/shared/lib'
import { Chip, Skeleton, ValueStrip } from '@/shared/ui'

import { weightSteps } from '../../config/settings-options'
import { SettingsSection } from '../settings-section'

interface DefaultsSectionProps {
  shown: Profile
  loaded: boolean
  update: (patch: ProfilePatch) => void
}

export function DefaultsSection({ shown, loaded, update }: DefaultsSectionProps) {
  return (
    <SettingsSection id="h-defaults" title="По умолчанию">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between">
          <b className="text-[15px] font-semibold">Отдых между подходами</b>
          {loaded ? (
            <span className="text-[13px] leading-[1.4] text-muted-foreground tabular-nums">
              {shown.defaultRestSec} с
            </span>
          ) : (
            <Skeleton className="inline-block h-[18px] w-10" />
          )}
        </div>
        {loaded ? (
          <ValueStrip
            label="Отдых между подходами"
            value={shown.defaultRestSec}
            min={15}
            max={300}
            step={15}
            integer
            format={formatDuration}
            className="mt-2"
            onChange={(defaultRestSec) => update({ defaultRestSec })}
          />
        ) : (
          <Skeleton className="mt-2 min-h-13 rounded-lg" />
        )}
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          листайте, чтобы найти значение
        </p>
      </div>
      <div>
        <b id="l-step" className="text-[15px] font-semibold">
          Шаг веса
        </b>
        <div role="group" aria-labelledby="l-step" className="mt-2 grid grid-cols-4 gap-1.5">
          {weightSteps.map((kg) => (
            <Chip
              key={kg}
              pressed={loaded && shown.defaultWeightStepKg === kg}
              className="min-h-13 text-[17px]"
              onPressedChange={() => update({ defaultWeightStepKg: kg })}
            >
              {kg.toLocaleString('ru')} кг
            </Chip>
          ))}
        </div>
      </div>
    </SettingsSection>
  )
}
