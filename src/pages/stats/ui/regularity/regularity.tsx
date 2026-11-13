import { useState } from 'react'
import { Link } from 'react-router'

import type { WithId, Workout } from '@/shared/api'
import { cn, formatDuration } from '@/shared/lib'
import { Section, Sheet, SheetContent, Stat } from '@/shared/ui'

import { dayMonth, formatTotal, inMonth, monthTitle, weekdayNames } from '../../lib/format'
import { monthStart } from '../../lib/month'
import {
  monthCalendar,
  totalDurationSec,
  workoutsThisWeek,
  type CalendarDay,
} from '../../model/calendar'

export function Regularity({
  workouts,
  now,
  firstMonth,
  plannedPerWeek,
  className,
}: {
  workouts: readonly WithId<Workout>[]
  now: Date
  /** The earliest month the calendar can show. */
  firstMonth: Date
  /** Sets planned per week in the schedule; 0 hides "из N". */
  plannedPerWeek: number
  className?: string
}) {
  const [shown, setShown] = useState(() => monthStart(now))
  const calendar = monthCalendar(workouts, shown, now)
  const total = formatTotal(totalDurationSec(workouts))
  const move = (by: number) => setShown(new Date(shown.getFullYear(), shown.getMonth() + by, 1))
  // A day with several workouts opens a list of them; a day with one opens that workout.
  const [picked, setPicked] = useState<CalendarDay<WithId<Workout>> | null>(null)

  return (
    <Section id="h-regular" title="Регулярность" className={className}>
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          disabled={shown <= monthStart(firstMonth)}
          className="h-11 rounded-lg text-[22px] disabled:text-border"
          onClick={() => move(-1)}
        >
          ‹
        </button>
        <b className="text-center text-[15px] font-bold capitalize">{monthTitle(shown)}</b>
        <button
          type="button"
          aria-label="Следующий месяц"
          disabled={shown >= monthStart(now)}
          className="h-11 rounded-lg text-[22px] disabled:text-border"
          onClick={() => move(1)}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayNames.map((d) => (
          <span key={d} aria-hidden="true" className="pb-0.5 text-[11px] text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: calendar.lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {calendar.days.map((day) => {
          const done = day.workouts.length > 0
          const cell = cn(
            'flex h-10 w-full items-center justify-center rounded-lg text-sm text-muted-foreground tabular-nums focus-ring',
            day.future && 'text-border',
            done && 'bg-primary font-bold text-on-accent',
            // Today keeps the dark text on the accent: a light edge and a dark band mark it instead.
            day.today &&
              (done
                ? 'shadow-[inset_0_0_0_2px_var(--color-foreground),inset_0_0_0_4px_var(--color-background)]'
                : 'text-foreground shadow-[inset_0_0_0_2px_var(--color-foreground)]'),
          )
          const names = day.workouts.map((w) => w.template.name).join(', ')

          const only = day.workouts.at(0)
          const label = `${dayMonth(day.date)}: ${names}`

          return day.workouts.length === 1 && only ? (
            <Link
              key={day.date.getDate()}
              to={`/workouts/${only.id}`}
              aria-label={label}
              className={cell}
            >
              {day.date.getDate()}
            </Link>
          ) : done ? (
            <button
              key={day.date.getDate()}
              type="button"
              aria-label={label}
              className={cell}
              onClick={() => setPicked(day)}
            >
              {day.date.getDate()}
            </button>
          ) : (
            <span key={day.date.getDate()} className={cell}>
              {day.date.getDate()}
            </span>
          )
        })}
      </div>

      <div className="grid grid-cols-3 border-t border-border">
        <Stat
          label="На этой неделе"
          value={workoutsThisWeek(workouts, now)}
          unit={plannedPerWeek > 0 ? `из ${plannedPerWeek}` : undefined}
          className="border-b border-border"
        />
        <Stat label={inMonth(shown)} value={calendar.count} className="border-b border-border" />
        <Stat
          label="Всего времени"
          value={total.value}
          unit={total.unit}
          className="border-b border-border"
        />
      </div>

      {workouts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Дни тренировок отметятся в календаре после первой завершённой тренировки.
        </p>
      )}
      <Sheet open={picked !== null} onOpenChange={(open) => !open && setPicked(null)}>
        <SheetContent title={picked ? dayMonth(picked.date) : ''}>
          <ul className="flex flex-col">
            {picked?.workouts.map((w) => (
              <li key={w.id} className="border-t border-border last:border-b">
                <Link
                  to={`/workouts/${w.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 py-2 text-[15px]"
                >
                  <b className="font-semibold">{w.template.name}</b>
                  <span className="text-[13px] text-muted-foreground tabular-nums">
                    {formatDuration(totalDurationSec([w]))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </Section>
  )
}
