import { Link } from 'react-router'

import { useCatalogById } from '@/entities/exercise'
import { estimateDurationMin, placeLabels, type ListedTemplate } from '@/entities/template'
import type { Profile } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Badge, HoldButton } from '@/shared/ui'

import { daysText, exercisesWord, musclesText } from '../../lib/format'

interface TemplateRowProps {
  set: ListedTemplate
  schedule: Profile['schedule'] | undefined
  copied: boolean
  onView: (set: ListedTemplate) => void
  onStart: (set: ListedTemplate) => void
  onCopy: (set: ListedTemplate) => void
}

export function TemplateRow({ set, schedule, copied, onView, onStart, onCopy }: TemplateRowProps) {
  const { data: byId = {} } = useCatalogById()
  const minutes = estimateDurationMin(set, byId)
  const days = daysText(set.ref, schedule)

  return (
    <li className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-border py-3.5 min-[900px]:grid-cols-[minmax(0,1fr)_70px_110px_90px_330px] min-[900px]:items-center min-[900px]:gap-x-5 min-[900px]:py-3">
      {/* The whole row opens the set; its own buttons sit above this layer. */}
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => onView(set)}
        className="text-left text-[17px] leading-tight font-bold outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring focus-visible:after:outline-solid"
      >
        {set.name}
      </button>
      <Badge
        className={cn(
          'col-start-2 row-start-1 self-start justify-self-end px-2.5 text-xs min-[900px]:row-span-2 min-[900px]:self-center min-[900px]:justify-self-start',
          set.place === 'home' && 'border border-border bg-transparent text-muted-foreground',
        )}
      >
        {placeLabels[set.place]}
      </Badge>
      <span className="col-start-1 text-sm tabular-nums min-[900px]:hidden">
        {exercisesWord(set.entries.length)} · ~{minutes} мин
      </span>
      <span className="col-start-1 text-sm text-muted-foreground min-[900px]:row-start-2">
        {musclesText(set.entries, byId)}
        {days && (
          <>
            {' · '}
            <span className="text-primary">{days}</span>
          </>
        )}
      </span>
      <span className="hidden text-[15px] tabular-nums min-[900px]:col-start-3 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:block">
        {set.entries.length}
      </span>
      <span className="hidden text-[15px] tabular-nums min-[900px]:col-start-4 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:block">
        ~{minutes} мин
      </span>
      <span className="relative col-span-full mt-2 flex gap-2 min-[900px]:col-span-1 min-[900px]:col-start-5 min-[900px]:row-span-2 min-[900px]:row-start-1 min-[900px]:mt-0 min-[900px]:grid min-[900px]:grid-cols-[1fr_1.6fr]">
        <HoldButton
          label="Начать"
          className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-[18px] text-[15px] font-semibold text-on-accent focus-ring min-[900px]:px-3"
          aria-label={`Начать «${set.name}»`}
          onConfirm={() => onStart(set)}
        />
        {set.ref.source === 'own' ? (
          <Link
            to={`/templates/${set.ref.id}`}
            className="flex min-h-11 items-center justify-center rounded-lg border border-border px-[18px] text-[15px] font-semibold focus-ring min-[900px]:px-3"
            aria-label={`Изменить «${set.name}»`}
          >
            Изменить
          </Link>
        ) : (
          <button
            type="button"
            disabled={copied}
            className="flex min-h-11 items-center justify-center rounded-lg border border-border px-[18px] text-[15px] font-semibold focus-ring disabled:text-muted-foreground min-[900px]:px-3"
            aria-label={
              copied ? `«${set.name}» уже скопирован` : `Скопировать «${set.name}» к себе`
            }
            onClick={() => onCopy(set)}
          >
            {copied ? 'Скопирован' : 'Скопировать к себе'}
          </button>
        )}
      </span>
    </li>
  )
}
