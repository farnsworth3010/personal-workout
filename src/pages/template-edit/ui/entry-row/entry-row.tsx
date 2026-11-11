import { photoUrl, type Exercise } from '@/entities/exercise'
import type { ExerciseKind } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui'

import { amountLabel, type Field, type Row } from '../../model/editor'
import { iconButton, input } from '../styles'

const kindNote = (kind: ExerciseKind, lastKg: number | undefined) =>
  ({
    strength: `Силовое · ${lastKg ? `в прошлый раз ${String(lastKg).replace('.', ',')} кг` : 'вес подставится после первой тренировки'}`,
    bodyweight: 'С весом тела · доп. вес по желанию',
    timed: 'На время',
    cardio: 'Кардио',
  })[kind]

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

  const field = (key: Field, label: string, decimal = false) => (
    <label className="block min-w-0">
      <small className="mb-1.5 block text-[13px] text-muted-foreground min-[900px]:mb-1 min-[900px]:text-xs">
        {label}
      </small>
      <input
        data-row={row.id}
        data-field={key}
        value={row[key]}
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-label={`${label}: ${name}`}
        aria-invalid={invalid(key) || undefined}
        onChange={(event) => onEdit(key, event.target.value)}
        className={cn(input, 'min-h-11 px-1.5 text-center text-[17px] font-semibold tabular-nums')}
      />
    </label>
  )

  const arrow = (delta: number, label: string, path: string, disabled: boolean) => (
    <button
      type="button"
      data-row={row.id}
      data-move={delta}
      disabled={disabled}
      aria-label={`${label}: ${name}`}
      onClick={() => onMove(delta)}
      className={cn(iconButton, 'border border-border')}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={path} />
      </svg>
    </button>
  )

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
        <button
          type="button"
          data-row={row.id}
          data-remove
          aria-label={`Убрать «${name}»`}
          onClick={onRemove}
          className={cn(iconButton, 'text-[26px] min-[900px]:order-1')}
        >
          ×
        </button>
      </div>
      {/* Without the catalog the kind is unknown, so the numbers cannot be edited safely. */}
      {exercise && (
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-2 min-[900px]:contents">
          {field('sets', 'Подходы')}
          {field('amount', amountLabel(exercise.kind), exercise.kind === 'cardio')}
          {field('rest', 'Отдых, с')}
          <div className="flex gap-1">
            {arrow(-1, 'Выше', 'm6 15 6-6 6 6', index === 0)}
            {arrow(1, 'Ниже', 'm6 9 6 6 6-6', last)}
          </div>
        </div>
      )}
    </li>
  )
}
