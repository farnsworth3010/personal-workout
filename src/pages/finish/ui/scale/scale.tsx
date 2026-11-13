import { cn } from '@/shared/lib'

interface ScaleProps {
  labelId: string
  value: number | undefined
  onChange: (value: number) => void
  ends: [string, string]
}

export function Scale({ labelId, value, onChange, ends }: ScaleProps) {
  return (
    <div>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={cn(
              'rounded-lg border border-border bg-surface font-bold focus-ring',
              'min-h-15 text-[22px] aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-accent',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  )
}
