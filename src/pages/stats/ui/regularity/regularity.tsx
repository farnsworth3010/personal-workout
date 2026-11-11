import { useState } from 'react'
import { Link } from 'react-router'

import type { WithId, Workout } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Sheet, SheetContent } from '@/shared/ui'

import {
  monthCalendar,
  totalDurationSec,
  workoutsThisWeek,
  type CalendarDay,
} from '../../model/calendar'
import { dayMonth, inMonth, monthTitle } from '../../model/format'
import { note, Section } from '../section'

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-3">
      <small className="mb-0.5 block text-xs text-muted-foreground">{label}</small>
      <b className="text-[26px] font-bold tabular-nums min-[900px]:text-2xl">{children}</b>
    </div>
  )
}

const unit = 'text-[15px] font-semibold text-muted-foreground'

function formatTotal(sec: number) {
  return sec >= 3600 ? (
    <>
      {Math.round(sec / 3600)} <em className={cn(unit, 'not-italic')}>ч</em>
    </>
  ) : (
    <>
      {Math.round(sec / 60)} <em className={cn(unit, 'not-italic')}>мин</em>
    </>
  )
}

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
        {weekdays.map((d) => (
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
            'flex h-10 w-full items-center justify-center rounded-lg text-sm text-muted-foreground tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
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
        <Stat label="На этой неделе">
          {workoutsThisWeek(workouts, now)}
          {plannedPerWeek > 0 && <em className={cn(unit, 'not-italic')}> из {plannedPerWeek}</em>}
        </Stat>
        <Stat label={inMonth(shown)}>{calendar.count}</Stat>
        <Stat label="Всего времени">{formatTotal(totalDurationSec(workouts))}</Stat>
      </div>

      {workouts.length === 0 && (
        <p className={note}>
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
                    {Math.round(totalDurationSec([w]) / 60)} мин
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
