import { useRef, useState } from 'react'

import { useCatalogById } from '@/entities/exercise'
import {
  estimateDurationMin,
  placeLabels,
  refKey,
  type ListedTemplate,
  type Place,
  type ReadyTemplate,
  type TemplateRef,
} from '@/entities/template'
import { limits } from '@/shared/api'
import { longDate, move } from '@/shared/lib'
import { HoldButton, Sheet, SheetContent } from '@/shared/ui'

import { samePair } from '../../model/schedule'
import { SetList } from '../set-list'

// home.html's day sheet: the weekday's ordered list, edited in place and saved on every change.
export function DaySheet({
  date,
  refs,
  sets,
  readyTemplates,
  place,
  find,
  onChange,
  onStart,
  onClose,
}: {
  date: Date | null
  refs: readonly TemplateRef[]
  sets: readonly ListedTemplate[]
  readyTemplates: readonly ReadyTemplate[]
  // Today's place: the picker offers only its sets, so a set is added for it.
  place: Place
  find: (ref: TemplateRef) => ListedTemplate | undefined
  onChange: (refs: TemplateRef[]) => void
  // Starts the set today; the schedule stays as it is.
  onStart: (set: ListedTemplate) => void
  onClose: () => void
}) {
  const { data: byId = {} } = useCatalogById()
  const [picking, setPicking] = useState(false)
  const list = useRef<HTMLOListElement>(null)
  const full = refs.length >= limits.daySets.max

  const title = date ? longDate(date) : ''

  const moveSet = (k: number, step: -1 | 1) => {
    onChange(move([...refs], k, step))

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
        description={
          picking
            ? place === 'home'
              ? 'Наборы для дома'
              : 'Наборы для зала'
            : 'Наборы идут по порядку и повторяются каждую неделю'
        }
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
              sets={sets.filter((s) => s.place === place)}
              mark={(set) =>
                refs.some((r) => samePair(r, set.ref, readyTemplates))
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
                          {placeLabels[set.place]} · {set.entries.length} упр. · ~
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
                          className="mr-1 min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground focus-ring"
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
                          onClick={() => moveSet(k, step)}
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
              className="min-h-12 rounded-lg border border-dashed border-border text-sm focus-ring disabled:cursor-default disabled:text-muted-foreground disabled:opacity-60"
            >
              + Добавить набор
            </button>
            {full && (
              <p className="-mt-1 text-[13px] text-muted-foreground">
                В день можно назначить не больше {limits.daySets.max} наборов
              </p>
            )}
            <button
              type="button"
              disabled={refs.length === 0}
              onClick={() => onChange([])}
              className="mt-1 min-h-12 rounded-lg border border-border text-sm focus-ring disabled:cursor-default disabled:text-muted-foreground disabled:opacity-60"
            >
              Без тренировки
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
