import { muscleLabels } from '@/entities/exercise'
import type { Muscle } from '@/shared/api'
import { cn } from '@/shared/lib'

import { formatSets } from '../../model/format'
import { loadLevel, type LoadLevel } from '../../model/muscle-load'
import { figure, midlineSpan, silhouette, type FigureView } from './shapes'

const levelFill: Record<LoadLevel, string> = {
  0: 'fill-surface-2',
  1: 'fill-primary/30',
  2: 'fill-primary/50',
  3: 'fill-primary/75',
  4: 'fill-primary',
}

// Untrained muscles get a dashed outline so they read as "not done".
const untrainedStroke = 'stroke-muted-foreground stroke-[0.9] [stroke-dasharray:2.2_1.8]'
const trainedStroke = 'stroke-surface stroke-[1.4]'
const pickedStroke = 'stroke-foreground stroke-[1.6]'

const viewLabels: Record<FigureView, [aria: string, caption: string]> = {
  front: ['Тело спереди', 'Спереди'],
  back: ['Тело сзади', 'Сзади'],
}

function Mirrored({ paths }: { paths: string[] }) {
  return paths.map((d) => [
    <path key={d} d={d} />,
    <path key={`${d}-m`} d={d} transform="matrix(-1 0 0 1 200 0)" />,
  ])
}

// Invisible hit area over the midline gap between a muscle's mirrored halves.
function MidlineBridge({ paths }: { paths: string[] }) {
  const span = midlineSpan(paths)
  if (!span) return null

  return (
    <rect
      data-hit="midline"
      x={98}
      y={span[0]}
      width={4}
      height={span[1] - span[0]}
      className="fill-transparent stroke-none"
    />
  )
}

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
                    isPicked ? pickedStroke : level === 0 ? untrainedStroke : trainedStroke,
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

const legend: [LoadLevel, string][] = [
  [0, 'нет'],
  [1, '1–3'],
  [2, '4–7'],
  [3, '8–11'],
  [4, '12+ подходов'],
]

const swatchOpacity: Record<LoadLevel, string> = {
  0: 'hidden',
  1: 'opacity-30',
  2: 'opacity-50',
  3: 'opacity-75',
  4: '',
}

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
