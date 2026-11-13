import type { Equipment } from '@/entities/exercise'
import { Badge } from '@/shared/ui'

import { EquipmentList } from '../equipment-list'
import { SettingsSection } from '../settings-section'

interface EquipmentSectionProps {
  home: readonly Equipment[] | undefined
  onChange: (next: Equipment[]) => void
}

export function EquipmentSection({ home, onChange }: EquipmentSectionProps) {
  return (
    <SettingsSection
      id="h-gear"
      title="Моё оборудование дома"
      className="mt-5 min-[900px]:col-start-2"
    >
      <EquipmentList home={home} onChange={onChange} />
      <p className="text-[13px] leading-[1.4] text-muted-foreground">
        Упражнения, для которых нужно что-то ещё, помечены <Badge>зал</Badge> и не попадают в
        домашние тренировки.
      </p>
    </SettingsSection>
  )
}
