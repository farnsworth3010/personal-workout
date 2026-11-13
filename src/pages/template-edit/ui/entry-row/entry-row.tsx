import { photoUrl, type Exercise } from '@/entities/exercise'
import { Badge } from '@/shared/ui'

import { amountLabel } from '../../config/amount-label'
import { kindNote } from '../../lib/kind-note'
import type { Field, Row } from '../../model/types'
import { IconButton } from '../icon-button'
import { MoveButton } from '../move-button'
import { NumberField } from '../number-field'

interface EntryRowProps {
  row: Row
  index: number
  last: boolean
  exercise: Exercise | undefined
  lastKg: number | undefined
  gym: boolean
  invalid: (field: Field) => boolean
  onEdit: (field: Field, value: string) => void
  onMove: (delta: number) => void
  onRemove: () => void
}

// One exercise of the set: photo, name, sets / amount / rest fields, reorder and remove.
export function EntryRow({
  row,
  index,
  last,
  exercise,
  lastKg,
  gym,
  invalid,
  onEdit,
  onMove,
  onRemove,
}: EntryRowProps) {
  const name = exercise?.name ?? row.exerciseId

  return (
    <li className="flex flex-col gap-2.5 border-b border-border py-3 min-[900px]:grid min-[900px]:grid-cols-[56px_minmax(0,1fr)_repeat(3,68px)_auto_44px] min-[900px]:items-center min-[900px]:gap-2.5 min-[900px]:py-2.5">
      <div className="grid grid-cols-[56px_minmax(0,1fr)_44px] items-center gap-3 min-[900px]:contents">
        <img
          src={exercise && photoUrl(exercise, 0)}
          alt=""
          className="size-14 rounded-lg bg-surface object-cover"
        />
        <div className="min-w-0">
          <b className="block text-base leading-tight font-semibold">
            <span className="text-muted-foreground tabular-nums">{index + 1}.</span> {name}
            {gym && <Badge className="ml-1.5 align-[1px]">зал</Badge>}
          </b>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {exercise
              ? kindNote(exercise.kind, lastKg)
              : 'Упражнение недоступно: его нет в каталоге, сохранится как было'}
          </span>
        </div>
        <IconButton
          data-row={row.id}
          data-remove
          aria-label={`Убрать «${name}»`}
          onClick={onRemove}
          className="text-[26px] min-[900px]:order-1"
        >
          ×
        </IconButton>
      </div>
      {/* Without the catalog the kind is unknown, so the numbers cannot be edited safely. */}
      {exercise && (
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-2 min-[900px]:contents">
          <NumberField
            rowId={row.id}
            field="sets"
            label="Подходы"
            exerciseName={name}
            value={row.sets}
            invalid={invalid('sets')}
            onChange={(value) => onEdit('sets', value)}
          />
          <NumberField
            rowId={row.id}
            field="amount"
            label={amountLabel(exercise.kind)}
            exerciseName={name}
            value={row.amount}
            decimal={exercise.kind === 'cardio'}
            invalid={invalid('amount')}
            onChange={(value) => onEdit('amount', value)}
          />
          <NumberField
            rowId={row.id}
            field="rest"
            label="Отдых, с"
            exerciseName={name}
            value={row.rest}
            invalid={invalid('rest')}
            onChange={(value) => onEdit('rest', value)}
          />
          <div className="flex gap-1">
            <MoveButton
              rowId={row.id}
              delta={-1}
              label="Выше"
              exerciseName={name}
              path="m6 15 6-6 6 6"
              disabled={index === 0}
              onMove={onMove}
            />
            <MoveButton
              rowId={row.id}
              delta={1}
              label="Ниже"
              exerciseName={name}
              path="m6 9 6 6 6-6"
              disabled={last}
              onMove={onMove}
            />
          </div>
        </div>
      )}
    </li>
  )
}
