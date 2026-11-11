import type { Place } from '@/entities/template'

import { capitalize } from '../lib/format'

// The date and title; the home/gym switch only when a planned set has a variant for the other place.
export function TodayHeader({
  date,
  place,
  onPlace,
}: {
  date: Date
  place?: Place
  onPlace: (place: Place) => void
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[13px] text-muted-foreground">
          {capitalize(
            date.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }),
          )}
        </p>
        <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[40px]">
          Сегодня
        </h1>
      </div>
      {place && (
        <div
          role="group"
          aria-label="Где тренируетесь"
          className="flex gap-[3px] rounded-lg border border-border bg-surface p-[3px]"
        >
          {(['home', 'gym'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={place === p}
              onClick={() => onPlace(p)}
              className="min-h-10 min-w-16 rounded-[4px] px-3 text-sm text-muted-foreground aria-pressed:bg-primary aria-pressed:font-bold aria-pressed:text-on-accent"
            >
              {p === 'home' ? 'Дома' : 'Зал'}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
