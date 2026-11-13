import { placeLabels, type Place } from '@/entities/template'
import { longDate } from '@/shared/lib'
import { Title } from '@/shared/ui'

interface TodayHeaderProps {
  date: Date
  // Absent only while the plan loads.
  place?: Place
  onPlace: (place: Place) => void
}

// The date, the title and today's Дома / Зал switch.
export function TodayHeader({ date, place, onPlace }: TodayHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[13px] text-muted-foreground">{longDate(date)}</p>
        <Title>Сегодня</Title>
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
              {placeLabels[p]}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
