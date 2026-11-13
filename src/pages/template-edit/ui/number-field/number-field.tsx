import type { Field } from '../../model/types'

interface NumberFieldProps {
  rowId: string
  field: Field
  label: string
  exerciseName: string
  value: string
  decimal?: boolean
  invalid: boolean
  onChange: (value: string) => void
}

export function NumberField({
  rowId,
  field,
  label,
  exerciseName,
  value,
  decimal = false,
  invalid,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block min-w-0">
      <small className="mb-1.5 block text-[13px] text-muted-foreground min-[900px]:mb-1 min-[900px]:text-xs">
        {label}
      </small>
      <input
        data-row={rowId}
        data-field={field}
        value={value}
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-label={`${label}: ${exerciseName}`}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-border bg-surface px-1.5 text-center text-[17px] font-semibold tabular-nums outline-none focus:border-primary aria-invalid:border-warn"
      />
    </label>
  )
}
