import { refKey, type ListedTemplate, type TemplateRef } from '@/entities/template'
import { capitalize, cn } from '@/shared/lib'

import { weekRange } from '../../lib/format'
import type { Week } from '../../model/types'

// home.html's week: every set of a day, its state, and a tap opens the day's editor.
export function WeekBlock({
  week,
  find,
  onOpenDay,
}: {
  week: Week
  find: (ref: TemplateRef) => ListedTemplate | undefined
  onOpenDay: (index: number) => void
}) {
  const planned = week.days.filter((d) => d.sets.length > 0)

  return (
    <section aria-labelledby="week-title">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] text-muted-foreground tabular-nums">
        <p id="week-title">Неделя · {weekRange(week.days)}</p>
        <p>
          Сделано {planned.filter((d) => d.state === 'done').length} из {planned.length}
        </p>
      </div>
      <div className="mt-0.5 mb-3 flex gap-1.5" aria-hidden="true">
        {planned.map((d) => (
          <i
            key={d.weekday}
            className={
              d.state === 'done'
                ? 'h-1 flex-1 rounded-full bg-primary'
                : d.state === 'partly'
                  ? 'h-1 flex-1 rounded-full bg-[linear-gradient(90deg,var(--primary)_50%,var(--surface-2)_50%)]'
                  : 'h-1 flex-1 rounded-full bg-surface-2'
            }
          />
        ))}
      </div>

      <ul>
        {week.days.map((day, i) => {
          const done = day.sets.filter((s) => s.done).length
          const status =
            day.state === 'done'
              ? '✓ Сделано'
              : day.state === 'partly'
                ? `${done} из ${day.sets.length}`
                : day.today
                  ? 'Сегодня'
                  : ''

          return (
            <li key={day.weekday}>
              <button
                type="button"
                onClick={() => onOpenDay(i)}
                aria-current={day.today ? 'date' : undefined}
                className="relative grid min-h-[52px] w-full grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-border py-1 pr-2 text-left focus-ring in-[li:first-child]:border-t aria-[current=date]:grid-cols-[36px_1fr_auto] aria-[current=date]:bg-surface aria-[current=date]:pl-2 aria-[current=date]:before:absolute aria-[current=date]:before:inset-y-0 aria-[current=date]:before:left-0 aria-[current=date]:before:w-0.5 aria-[current=date]:before:bg-primary"
              >
                <span className="flex flex-col leading-[1.15]">
                  <b className={cn('text-[15px] font-bold', day.today && 'text-primary')}>
                    {capitalize(day.date.toLocaleDateString('ru', { weekday: 'short' }))}
                  </b>
                  <small className="text-xs text-muted-foreground tabular-nums">
                    {day.date.getDate()}
                  </small>
                </span>
                <span
                  className={cn(
                    'min-w-0 py-1.5 text-[15px] leading-[1.3]',
                    day.sets.length === 0 && 'text-muted-foreground',
                  )}
                >
                  {day.sets.length === 0
                    ? 'Отдых'
                    : day.sets.map((s, k) => (
                        <span key={`${refKey(s.ref)}-${k}`}>
                          {k > 0 && ' · '}
                          {day.state === 'partly' && s.done && (
                            <span className="text-primary">✓ </span>
                          )}
                          {find(s.ref)?.name ?? 'Набор удалён'}
                        </span>
                      ))}
                </span>
                <span
                  className={cn(
                    'text-[13px] whitespace-nowrap tabular-nums',
                    day.state === 'done' || day.today
                      ? 'text-primary'
                      : day.state === 'partly'
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {status}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Нажмите на день, чтобы изменить его наборы
      </p>
    </section>
  )
}
