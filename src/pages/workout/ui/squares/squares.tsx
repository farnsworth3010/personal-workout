import { cn } from '@/shared/lib'

export function Squares({ value, label }: { value: number; label: string }) {
  return (
    <span role="img" aria-label={`${label}: ${value} из 5`} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={cn('size-[22px] rounded-sm', i <= value ? 'bg-primary' : 'bg-surface-2')}
        />
      ))}
    </span>
  )
}
