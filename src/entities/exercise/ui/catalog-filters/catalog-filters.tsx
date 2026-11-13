import { useId, type ReactNode } from 'react'

import { cn } from '@/shared/lib'
import { Chip, ChipRow, Switch } from '@/shared/ui'

import { muscleGroupList } from '../../config/groups'
import { equipmentLabels, equipmentList } from '../../config/labels'
import type { CatalogChoice } from '../../model/types'

interface CatalogFiltersProps {
  value: CatalogChoice
  onChange: (patch: Partial<CatalogChoice>) => void
  // The first chip of each row: «Все» on the catalog page, «Все мышцы» in the picker.
  allMuscles: string
  anyEquipment: string
  // Shows the row names above the chips; otherwise they only name the groups for screen readers.
  labelled?: boolean
  // A second line under «Только для дома», e.g. which equipment counts as home.
  homeHint?: ReactNode
}

// Muscle and equipment chips and the home switch; the parent keeps the choice.
export function CatalogFilters({
  value,
  onChange,
  allMuscles,
  anyEquipment,
  labelled = false,
  homeHint,
}: CatalogFiltersProps) {
  const id = useId()
  const rowLabel = labelled ? 'mb-1.5 block text-[13px] text-muted-foreground' : 'sr-only'

  return (
    <>
      <div className="min-w-0">
        <small id={`${id}-muscles`} className={rowLabel}>
          Мышцы
        </small>
        <ChipRow role="group" aria-labelledby={`${id}-muscles`}>
          <Chip pressed={!value.group} onPressedChange={() => onChange({ group: null })}>
            {allMuscles}
          </Chip>
          {muscleGroupList.map(([key, { label }]) => (
            <Chip
              key={key}
              pressed={value.group === key}
              onPressedChange={() => onChange({ group: key })}
            >
              {label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div className="min-w-0">
        <small id={`${id}-equipment`} className={rowLabel}>
          Оборудование
        </small>
        <ChipRow role="group" aria-labelledby={`${id}-equipment`}>
          <Chip pressed={!value.equipment} onPressedChange={() => onChange({ equipment: null })}>
            {anyEquipment}
          </Chip>
          {equipmentList.map((key) => (
            <Chip
              key={key}
              pressed={value.equipment === key}
              onPressedChange={() => onChange({ equipment: key })}
            >
              {equipmentLabels[key]}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <label
        htmlFor={`${id}-home`}
        className={cn(
          'flex cursor-pointer items-center justify-between gap-3',
          homeHint === undefined
            ? 'min-h-11 text-[15px]'
            : 'min-h-14 border-y border-border py-1.5',
        )}
      >
        {homeHint === undefined ? (
          'Только для дома'
        ) : (
          <span>
            <b className="block text-base font-semibold">Только для дома</b>
            <small className="mt-0.5 block text-[13px] text-muted-foreground">{homeHint}</small>
          </span>
        )}
        <Switch
          id={`${id}-home`}
          checked={value.homeOnly}
          onCheckedChange={(homeOnly) => onChange({ homeOnly })}
        />
      </label>
    </>
  )
}
