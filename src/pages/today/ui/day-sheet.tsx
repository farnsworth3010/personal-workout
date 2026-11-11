import { useRef, useState } from 'react'

import { estimateDurationMin, type TemplateRef } from '@/entities/template'
import { HoldButton, Sheet, SheetContent } from '@/shared/ui'

import { SetList } from './set-list'
import { capitalize, placeLabel } from '../lib/format'
import { refKey, type ExercisesById, type SetInfo } from '../model/sets'

const MAX_SETS = 5

const field =
  'rounded-lg border border-border text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:cursor-default disabled:text-muted-foreground disabled:opacity-60'

// home.html's day sheet: the weekday's ordered list, edited in place and saved on every change.
export function DaySheet({
  date,
  refs,
  sets,
  find,
  byId,
  onChange,
  onStart,
  onClose,
}: {
  date: Date | null
  refs: readonly TemplateRef[]
  sets: readonly SetInfo[]
  find: (ref: TemplateRef) => SetInfo | undefined
  byId: ExercisesById
  onChange: (refs: TemplateRef[]) => void
  // Starts the set today; the schedule stays as it is.
  onStart: (set: SetInfo) => void
  onClose: () => void
}) {
  const [picking, setPicking] = useState(false)
  const list = useRef<HTMLOListElement>(null)
  const full = refs.length >= MAX_SETS

  const title = date
    ? capitalize(date.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }))
    : ''

  const move = (k: number, step: -1 | 1) => {
    const next = [...refs]
    ;[next[k], next[k + step]] = [next[k + step], next[k]]
    onChange(next)

    // Keep the keyboard on the moved set; at an end of the list its other arrow takes over.
    requestAnimationFrame(() => {
      const row = list.current?.children[k + step]
      const buttons = row?.querySelectorAll<HTMLButtonElement>('button[data-move]')
      const target = [...(buttons ?? [])].find(
        (b) => b.dataset.move === String(step) && !b.disabled,
      )
      ;(target ?? [...(buttons ?? [])].find((b) => !b.disabled))?.focus()
    })
  }

  return (
    <Sheet
      open={date !== null}
      onOpenChange={(open) => {
        if (open) return
        setPicking(false)
        onClose()
      }}
    >
      <SheetContent
        title={picking ? 'Добавить набор' : title}
        description={picking ? undefined : 'Наборы идут по порядку и повторяются каждую неделю'}
      >
        {picking ? (
          <>
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="min-h-11 self-start text-sm text-muted-foreground"
            >
              ← К наборам дня
            </button>
            <SetList
              sets={sets}
              byId={byId}
              mark={(set) =>
                refs.some((r) => refKey(r) === refKey(set.ref))
                  ? { text: 'Уже в дне', disabled: true }
                  : null
              }
              onPick={(set) => {
                onChange([...refs, set.ref])
                setPicking(false)
              }}
            />
          </>
        ) : (
          <>
            <ol ref={list} aria-label="Наборы дня" className="flex flex-col gap-1.5">
              {refs.length === 0 && (
                <li className="py-2 text-sm text-muted-foreground">
                  Наборов нет — это день отдыха
                </li>
              )}
              {refs.map((ref, k) => {
                const set = find(ref)
                const name = set?.name ?? 'Набор удалён'

                return (
                  <li
                    key={`${refKey(ref)}-${k}`}
                    className="grid min-h-[60px] grid-cols-[minmax(0,1fr)_auto] items-center gap-1 rounded-lg border border-border bg-background py-1 pl-3"
                  >
                    <span>
                      <b className="block text-[15px] font-semibold">
                        {k + 1}. {name}
                      </b>
                      {set && (
                        <small className="mt-0.5 block text-[13px] text-muted-foreground tabular-nums">
                          {placeLabel(set.place)} · {set.entries.length} упр. · ~
                          {estimateDurationMin(set, byId)} мин
                        </small>
                      )}
                    </span>
                    <span className="flex items-center text-lg text-muted-foreground">
                      {set && (
                        <HoldButton
                          label="Начать"
                          aria-label={`Начать «${name}» сегодня`}
                          onConfirm={() => onStart(set)}
                          className="mr-1 min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
                        />
                      )}
                      {(
                        [
                          [-1, '↑', 'Выше'],
                          [1, '↓', 'Ниже'],
                        ] as const
                      ).map(([step, icon, label]) => (
                        <button
                          key={step}
                          type="button"
                          data-move={step}
                          aria-label={`${label}: ${name}`}
                          disabled={step < 0 ? k === 0 : k === refs.length - 1}
                          onClick={() => move(k, step)}
                          className="size-11 disabled:cursor-default disabled:opacity-30"
                        >
                          {icon}
                        </button>
                      ))}
                      <button
                        type="button"
                        aria-label={`Убрать: ${name}`}
                        onClick={() => onChange(refs.filter((_, i) => i !== k))}
                        className="size-11"
                      >
                        ×
                      </button>
                    </span>
                  </li>
                )
              })}
            </ol>
            <button
              type="button"
              disabled={full}
              onClick={() => setPicking(true)}
              className={`${field} min-h-12 border-dashed`}
            >
              + Добавить набор
            </button>
            {full && (
              <p className="-mt-1 text-[13px] text-muted-foreground">
                В день можно назначить не больше 5 наборов
              </p>
            )}
            <button
              type="button"
              disabled={refs.length === 0}
              onClick={() => onChange([])}
              className={`${field} mt-1 min-h-12`}
            >
              Без тренировки
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
