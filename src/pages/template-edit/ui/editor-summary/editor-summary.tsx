import type { RefObject } from 'react'

import { muscleGroupsText, useCatalogById } from '@/entities/exercise'
import { estimateDurationMin, gymOnlyCount, muscleGroupsOf } from '@/entities/template'
import type { Equipment } from '@/shared/api'
import { Title } from '@/shared/ui'

import { previewEntries } from '../../model/rows'
import type { KindOf, Row } from '../../model/types'

interface EditorSummaryProps {
  title: string
  name: string
  nameInputRef: RefObject<HTMLInputElement | null>
  nameInvalid: boolean
  onNameChange: (name: string) => void
  rows: readonly Row[]
  kindOf: KindOf
  homeEquipment: Equipment[]
}

// The title, the name field and what the set adds up to: count, length, muscles, gym warning.
export function EditorSummary({
  title,
  name,
  nameInputRef,
  nameInvalid,
  onNameChange,
  rows,
  kindOf,
  homeEquipment,
}: EditorSummaryProps) {
  const byId = useCatalogById().data ?? {}
  const entries = previewEntries(rows, kindOf)
  const gymCount = gymOnlyCount({ entries }, byId, homeEquipment)
  const muscles = muscleGroupsText(muscleGroupsOf({ entries }, byId))

  return (
    <>
      <Title className="min-[900px]:text-[32px]">{title}</Title>

      <label className="block">
        <small className="mb-1.5 block text-[13px] text-muted-foreground">Название</small>
        <input
          ref={nameInputRef}
          value={name}
          autoComplete="off"
          placeholder="Вторник: спина"
          aria-invalid={nameInvalid || undefined}
          onChange={(event) => onNameChange(event.target.value)}
          className="min-h-13 w-full rounded-lg border border-border bg-surface px-3.5 text-lg font-semibold outline-none focus:border-primary aria-invalid:border-warn"
        />
      </label>

      <dl className="grid grid-cols-2 border-y border-border">
        <div className="py-2.5">
          <dt className="mb-0.5 text-xs text-muted-foreground">Упражнений</dt>
          <dd className="text-2xl font-bold tabular-nums">{rows.length}</dd>
        </div>
        <div className="py-2.5">
          <dt className="mb-0.5 text-xs text-muted-foreground">Примерно</dt>
          <dd className="text-2xl font-bold tabular-nums">
            ~{estimateDurationMin({ entries }, byId)} мин
          </dd>
        </div>
      </dl>

      <p className="text-sm text-muted-foreground">
        {muscles ? `Мышцы: ${muscles}` : 'Мышцы появятся, когда добавите упражнения'}
      </p>

      {gymCount > 0 && (
        <p className="flex items-baseline gap-2 text-[15px] font-semibold text-warn">
          <span
            aria-hidden
            className="size-5 shrink-0 translate-y-[3px] rounded-full bg-warn text-center text-[13px] leading-5 font-extrabold text-on-accent"
          >
            !
          </span>
          <span>
            В наборе есть упражнения для зала: <span className="tabular-nums">{gymCount}</span>
            <span className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
              Для них нужно оборудование, которого нет в вашем профиле
            </span>
          </span>
        </p>
      )}
    </>
  )
}
