import { muscleLabels } from '@/entities/exercise'
import type { Muscle } from '@/shared/api'
import { cn } from '@/shared/lib'

import { levelFill, viewLabels } from '../../config/muscle-map'
import { figure, silhouette } from '../../config/shapes'
import { formatSets } from '../../lib/format'
import { loadLevel } from '../../model/muscle-load'
import { MidlineBridge } from '../midline-bridge'
import { Mirrored } from '../mirrored'

interface MuscleMapProps {
  /** Sets this week per muscle; a missing muscle counts as 0. */
  load: Partial<Record<Muscle, number>>
  selected: Muscle | null
  onSelect: (muscle: Muscle) => void
}

export function MuscleMap({ load, selected, onSelect }: MuscleMapProps) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 min-[900px]:gap-4">
      {(['front', 'back'] as const).map((view) => (
        <figure key={view} className="flex min-w-0 flex-col items-center gap-1">
          <svg
            viewBox="0 0 200 440"
            role="group"
            aria-label={viewLabels[view][0]}
            className="block h-auto max-h-[600px] w-full"
          >
            <g className="fill-surface stroke-border stroke-3">
              <Mirrored paths={silhouette} />
            </g>
            <g className="fill-surface">
              <Mirrored paths={silhouette} />
            </g>
            {Object.entries(figure[view]).map(([key, paths]) => {
              const muscle = key as Muscle
              const sets = load[muscle] ?? 0
              const level = loadLevel(sets)
              const isPicked = muscle === selected

              return (
                <g
                  key={muscle}
                  role="button"
                  tabIndex={0}
                  aria-label={`${muscleLabels[muscle]}: ${formatSets(sets)}`}
                  aria-pressed={isPicked}
                  data-level={level}
                  className={cn(
                    'cursor-pointer transition-colors outline-none [stroke-linejoin:round] focus-visible:stroke-foreground focus-visible:stroke-[1.6] focus-visible:[stroke-dasharray:none]',
                    levelFill[level],
                    // Untrained muscles get a dashed outline so they read as "not done".
                    isPicked
                      ? 'stroke-foreground stroke-[1.6]'
                      : level === 0
                        ? 'stroke-muted-foreground stroke-[0.9] [stroke-dasharray:2.2_1.8]'
                        : 'stroke-surface stroke-[1.4]',
                  )}
                  onClick={() => onSelect(muscle)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return

                    event.preventDefault()
                    onSelect(muscle)
                  }}
                >
                  <Mirrored paths={paths} />
                  <MidlineBridge paths={paths} />
                </g>
              )
            })}
          </svg>
          <figcaption className="text-xs text-muted-foreground">{viewLabels[view][1]}</figcaption>
        </figure>
      ))}
    </div>
  )
}
