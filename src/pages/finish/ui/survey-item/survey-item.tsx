import { useId, type ReactNode } from 'react'

import { cn } from '@/shared/lib'

interface SurveyItemProps {
  title: string
  skipped: boolean
  onSkip: () => void
  children: (labelId: string) => ReactNode
}

export function SurveyItem({ title, skipped, onSkip, children }: SurveyItemProps) {
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
