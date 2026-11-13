import { cn } from '@/shared/lib'

import { legend, swatchOpacity } from '../../config/muscle-map'

export function MuscleLegend() {
  return (
    <ul
      aria-label="Подходов за неделю"
      className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground"
    >
      {legend.map(([level, label]) => (
        <li key={level} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              'inline-block size-3.5 overflow-hidden rounded-[3px] bg-surface',
              level === 0 && 'border border-dashed border-muted-foreground bg-surface-2',
            )}
          >
            <span className={cn('block size-full bg-primary', swatchOpacity[level])} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  )
}
