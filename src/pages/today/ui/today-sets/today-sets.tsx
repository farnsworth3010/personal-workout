import { Link } from 'react-router'

import { useCatalogById } from '@/entities/exercise'
import { refKey, type ListedTemplate } from '@/entities/template'
import { clockTime, cn } from '@/shared/lib'
import { buttonVariants, HoldButton, Title } from '@/shared/ui'

import { setFocus, setMeta } from '../../lib/format'
import type { TodaySet } from '../../model/types'
import { SetBody } from '../set-body'

interface TodaySetsProps {
  items: readonly TodaySet[]
  open: number | null
  onOpen: (index: number) => void
  onStart: (set: ListedTemplate) => void
  onOther: () => void
}

// home.html's today list: done sets with their time, the open one with its exercises, the rest waiting.
export function TodaySets({ items, open, onOpen, onStart, onOther }: TodaySetsProps) {
  const { data: byId = {} } = useCatalogById()

  return (
    <ol aria-label="Наборы на сегодня" className="border-t border-border">
      {items.map(({ set, doneAt, workoutId, swappedTo }, i) => {
        const done = doneAt !== null && doneAt !== undefined
        const isOpen = i === open && !done && set !== undefined
        const name = set?.name ?? 'Набор удалён'

        return (
          <li key={set ? `${refKey(set.ref)}-${i}` : i} className="border-b border-border">
            <div className="grid min-h-16 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-2">
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-7 place-items-center rounded-full border text-[13px] font-bold tabular-nums',
                  done
                    ? 'border-primary bg-primary text-on-accent'
                    : isOpen
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground',
                )}
              >
                {done ? '✓' : i + 1}
              </span>

              {done || !set ? (
                <div className="flex min-h-11 min-w-0 flex-col justify-center">
                  <b className="text-[17px] leading-[1.2] font-bold">{name}</b>
                  {set && (
                    <small className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
                      {setMeta(set, byId)}
                    </small>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => onOpen(i)}
                  className="flex min-h-11 w-full min-w-0 flex-col justify-center text-left focus-ring"
                >
                  {isOpen ? (
                    <Title as="span" className="min-[900px]:text-[34px]">
                      {name}
                    </Title>
                  ) : (
                    <b className="text-[17px] leading-[1.2] font-bold">{name}</b>
                  )}
                  <small
                    className={cn(
                      'text-muted-foreground tabular-nums',
                      isOpen ? 'mt-1 text-sm' : 'mt-0.5 text-[13px]',
                    )}
                  >
                    {isOpen
                      ? `${setFocus(set, byId)}${swappedTo ? ` · вариант для ${swappedTo}` : ''}`
                      : setMeta(set, byId)}
                  </small>
                </button>
              )}

              {done ? (
                <Link
                  to={`/workouts/${workoutId ?? ''}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold whitespace-nowrap text-primary tabular-nums underline-offset-3 hover:underline"
                >
                  <span className="sr-only">Сделано в </span>
                  <span aria-hidden="true">✓ </span>
                  {clockTime(doneAt)}
                </Link>
              ) : (
                set &&
                !isOpen && (
                  <HoldButton
                    label="Начать"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'h-auto min-h-11 rounded-lg bg-transparent px-4 text-sm font-semibold',
                    )}
                    onConfirm={() => onStart(set)}
                  />
                )
              )}
            </div>

            {isOpen && <SetBody set={set} onStart={() => onStart(set)} onOther={onOther} />}
          </li>
        )
      })}
    </ol>
  )
}
