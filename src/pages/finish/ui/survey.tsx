import { useId, type ReactNode } from 'react'

import { cn, n1 } from '@/shared/lib'

import type { SurveyKey, SurveyState } from '../lib/survey'

const tile =
  'rounded-lg border border-border bg-surface font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid'

function Item({
  title,
  skipped,
  onSkip,
  children,
}: {
  title: string
  skipped: boolean
  onSkip: () => void
  children: (labelId: string) => ReactNode
}) {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-2.5 border-t border-border pt-4">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h3 id={labelId} className={cn('text-base font-bold', skipped && 'text-muted-foreground')}>
          {title}
          {skipped && (
            <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">пропущено</span>
          )}
        </h3>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 px-1 text-sm text-muted-foreground underline underline-offset-[3px]"
        >
          {skipped ? 'Вернуть' : 'Пропустить'}
        </button>
      </div>
      {!skipped && children(labelId)}
    </div>
  )
}

function Scale({
  labelId,
  value,
  onChange,
  ends,
}: {
  labelId: string
  value: number | undefined
  onChange: (value: number) => void
  ends: [string, string]
}) {
  return (
    <div>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={cn(
              tile,
              'min-h-15 text-[22px] aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-accent',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  )
}

const STEPS = [-0.5, -0.1, 0.1, 0.5]

const sinceDate = (date: Date) => date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

function BodyWeight({
  labelId,
  kg,
  previous,
  onChange,
}: {
  labelId: string
  kg: number | undefined
  previous: { kg: number; date: Date } | null
  onChange: (kg: number | undefined) => void
}) {
  // Without a previous value the buttons would start from an arbitrary number, so it is typed.
  if (!previous && kg === undefined)
    return (
      <input
        aria-labelledby={labelId}
        inputMode="decimal"
        placeholder="Например, 75,5"
        onBlur={(event) => {
          const value = Number(event.currentTarget.value.replace(',', '.'))
          if (value > 0 && value < 400) onChange(Math.round(value * 10) / 10)
        }}
        className="min-h-12 rounded-lg border border-border bg-background px-3.5 text-[17px] outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    )

  const value = kg ?? previous?.kg ?? 0
  const delta = previous ? Math.round((value - previous.kg) * 10) / 10 : 0

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
            : `${delta > 0 ? '+' : '−'}${n1(Math.abs(delta))} кг к прошлому разу`}
        </p>
      )}
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-4 gap-1.5">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            aria-label={`${step < 0 ? 'Минус' : 'Плюс'} ${n1(Math.abs(step))} кг`}
            // Tenths as integers, so repeated taps do not drift.
            onClick={() => onChange(Math.max(0.1, Math.round(value * 10 + step * 10) / 10))}
            className={cn(tile, 'min-h-13 text-[17px] font-semibold active:bg-surface-2')}
          >
            {step < 0 ? '−' : '+'}
            {n1(Math.abs(step))}
          </button>
        ))}
      </div>
    </div>
  )
}

// finish.html's survey; every item can be skipped.
export function Survey({
  value,
  onChange,
  previousWeight,
}: {
  value: SurveyState
  onChange: (value: SurveyState) => void
  previousWeight: { kg: number; date: Date } | null | undefined
}) {
  const set = (patch: Partial<SurveyState>) => onChange({ ...value, ...patch })

  const toggle = (key: SurveyKey) => {
    const skipped = new Set(value.skipped)
    if (!skipped.delete(key)) skipped.add(key)
    set({ skipped })
  }

  return (
    <>
      <div>
        <h2 className="text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase">
          Как прошло?
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Любой пункт можно пропустить</p>
      </div>

      <Item
        title="Самочувствие"
        skipped={value.skipped.has('wellbeing')}
        onSkip={() => toggle('wellbeing')}
      >
        {(id) => (
          <Scale
            labelId={id}
            value={value.wellbeing}
            onChange={(wellbeing) => set({ wellbeing })}
            ends={['плохо', 'отлично']}
          />
        )}
      </Item>

      <Item title="Энергия" skipped={value.skipped.has('energy')} onSkip={() => toggle('energy')}>
        {(id) => (
          <Scale
            labelId={id}
            value={value.energy}
            onChange={(energy) => set({ energy })}
            ends={['нет сил', 'полно сил']}
          />
        )}
      </Item>

      <Item title="Вес тела" skipped={value.skipped.has('weight')} onSkip={() => toggle('weight')}>
        {(id) =>
          previousWeight === undefined ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : (
            <BodyWeight
              labelId={id}
              kg={value.weightKg}
              previous={previousWeight}
              onChange={(weightKg) => set({ weightKg })}
            />
          )
        }
      </Item>
    </>
  )
}
