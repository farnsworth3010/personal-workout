import { weightChange, weightDelta } from '@/entities/workout'
import { cn, n1 } from '@/shared/lib'

import { bodyWeightSteps } from '../../config/body-weight-steps'
import { sinceDate } from '../../lib/format'

interface BodyWeightProps {
  labelId: string
  kg: number | undefined
  previous: { kg: number; date: Date } | null
  onChange: (kg: number | undefined) => void
}

export function BodyWeight({ labelId, kg, previous, onChange }: BodyWeightProps) {
  const commit = (input: HTMLInputElement) => {
    const value = Number(input.value.replace(',', '.'))
    if (value > 0 && value < 400) onChange(Math.round(value * 10) / 10)
  }

  // Without a previous value the buttons would start from an arbitrary number, so it is typed.
  if (!previous && kg === undefined)
    return (
      <input
        aria-labelledby={labelId}
        inputMode="decimal"
        placeholder="Например, 75,5"
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget)
        }}
        className="min-h-12 rounded-lg border border-border bg-background px-3.5 text-[17px] outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    )

  const value = kg ?? previous?.kg ?? 0
  const delta = previous ? weightDelta(value, previous.kg) : 0

  return (
    <div className="flex flex-col gap-2.5">
      <p aria-live="polite" className="flex items-baseline justify-center gap-2 py-1">
        <b className="text-[52px] leading-none font-extrabold tabular-nums min-[900px]:text-[60px]">
          {value.toLocaleString('ru', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </b>
        <span className="text-lg font-semibold text-muted-foreground">кг</span>
      </p>
      {previous && (
        <p
          className={cn(
            'min-h-[18px] text-center text-[13px] tabular-nums',
            delta < 0 ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {delta === 0
            ? `как в прошлый раз · ${sinceDate(previous.date)}`
            : weightChange(value, previous.kg)}
        </p>
      )}
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-4 gap-1.5">
        {bodyWeightSteps.map((step) => (
          <button
            key={step}
            type="button"
            aria-label={`${step < 0 ? 'Минус' : 'Плюс'} ${n1(Math.abs(step))} кг`}
            // Tenths as integers, so repeated taps do not drift.
            onClick={() => onChange(Math.max(0.1, Math.round(value * 10 + step * 10) / 10))}
            className={cn(
              'rounded-lg border border-border bg-surface font-bold focus-ring',
              'min-h-13 text-[17px] font-semibold active:bg-surface-2',
            )}
          >
            {step < 0 ? '−' : '+'}
            {n1(Math.abs(step))}
          </button>
        ))}
      </div>
    </div>
  )
}
