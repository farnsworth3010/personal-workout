import type { RefObject } from 'react'

import { useCatalogById } from '@/entities/exercise'
import { needsGym } from '@/entities/template'
import { useExerciseStats } from '@/entities/workout'
import type { Equipment } from '@/shared/api'

import { heaviestKg } from '../../lib/summary'
import type { Field, Problem, Row } from '../../model/types'
import { EntryRow } from '../entry-row'

interface EntryListProps {
  uid: string
  rows: readonly Row[]
  problem: Problem | null
  listRef: RefObject<HTMLOListElement | null>
  addButtonRef: RefObject<HTMLButtonElement | null>
  homeEquipment: Equipment[]
  onEdit: (key: string, field: Field, value: string) => void
  onMove: (key: string, delta: number) => void
  onRemove: (key: string) => void
  onAdd: () => void
}

// The set's rows (or the empty note) and «Добавить упражнение».
export function EntryList({
  uid,
  rows,
  problem,
  listRef,
  addButtonRef,
  homeEquipment,
  onEdit,
  onMove,
  onRemove,
  onAdd,
}: EntryListProps) {
  const { data: byId } = useCatalogById()
  const stats = useExerciseStats(
    uid,
    rows.map((r) => r.exerciseId),
  )

  const invalid = (index: number, field: Field) =>
    typeof problem?.focus === 'object' &&
    problem.focus.row === index &&
    problem.focus.field === field

  return (
    <>
      {rows.length > 0 ? (
        <ol ref={listRef} aria-label="Упражнения набора" className="border-t border-border">
          {rows.map((row, index) => {
            const exercise = byId?.[row.exerciseId]
            const lastSets = stats?.[row.exerciseId]?.lastSets

            return (
              <EntryRow
                key={row.id}
                row={row}
                index={index}
                last={index === rows.length - 1}
                exercise={exercise}
                lastKg={lastSets && heaviestKg(lastSets)}
                gym={exercise !== undefined && needsGym(exercise, homeEquipment)}
                invalid={(field) => invalid(index, field)}
                onEdit={(field, value) => onEdit(row.id, field, value)}
                onMove={(delta) => onMove(row.id, delta)}
                onRemove={() => onRemove(row.id)}
              />
            )
          })}
        </ol>
      ) : (
        <p className="border-y border-border py-6 text-[15px] leading-[1.4] text-muted-foreground">
          В наборе пока нет упражнений. Добавьте их из каталога: порядок, подходы и отдых
          настраиваются здесь.
        </p>
      )}

      <button
        ref={addButtonRef}
        type="button"
        onClick={onAdd}
        className="min-h-13 rounded-lg border border-dashed border-muted-foreground text-base font-semibold focus-ring hover:border-primary hover:text-primary"
      >
        + Добавить упражнение
      </button>
    </>
  )
}
