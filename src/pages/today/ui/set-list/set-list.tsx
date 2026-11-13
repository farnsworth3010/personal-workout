import { useCatalogById } from '@/entities/exercise'
import { estimateDurationMin, placeLabels, refKey, type ListedTemplate } from '@/entities/template'
import { cn } from '@/shared/lib'
import { HoldButton } from '@/shared/ui'

// One row per set, grouped into the person's own and the ready-made ones.
export function SetList({
  sets,
  onPick,
  mark,
  hold = false,
}: {
  sets: readonly ListedTemplate[]
  onPick: (set: ListedTemplate) => void
  // A note on the right; a set with { disabled: true } cannot be picked.
  mark?: (set: ListedTemplate) => { text: string; disabled?: boolean } | null
  // Picking starts a workout: a hold on touch, like every start (FR-045).
  hold?: boolean
}) {
  const { data: byId = {} } = useCatalogById()
  const groups = [
    { label: 'Мои наборы', sets: sets.filter((s) => s.ref.source === 'own') },
    { label: 'Готовые наборы', sets: sets.filter((s) => s.ref.source === 'ready') },
  ].filter((group) => group.sets.length > 0)

  return groups.map((group) => (
    <section key={group.label} aria-label={group.label} className="flex flex-col gap-1.5">
      <p className="mt-1.5 text-[13px] text-muted-foreground">{group.label}</p>
      {group.sets.map((set) => {
        const note = mark?.(set)
        const row = (
          <span className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
            <span>
              <b className="block text-[15px] font-semibold">{set.name}</b>
              <small className="mt-0.5 block text-[13px] text-muted-foreground tabular-nums">
                {placeLabels[set.place]} · {set.entries.length} упр. · ~
                {estimateDurationMin(set, byId)} мин
              </small>
            </span>
            <span className="text-[13px] text-muted-foreground">{note?.text}</span>
          </span>
        )
        const className =
          'flex min-h-14 w-full items-center rounded-lg border border-border bg-background px-3 py-2 text-left focus-ring disabled:cursor-default disabled:opacity-50'

        return hold ? (
          <HoldButton
            key={refKey(set.ref)}
            label={row}
            disabled={note?.disabled}
            onConfirm={() => onPick(set)}
            className={cn(className, '[&>span:last-child]:w-full')}
          />
        ) : (
          <button
            key={refKey(set.ref)}
            type="button"
            disabled={note?.disabled}
            onClick={() => onPick(set)}
            className={className}
          >
            {row}
          </button>
        )
      })}
    </section>
  ))
}
