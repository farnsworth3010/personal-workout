import { dayShort } from '../../lib/format'

export function RecordTile({
  label,
  value,
  date,
}: {
  label: string
  value: string | null
  date?: Date
}) {
  return (
    <div className="min-w-0 py-3 pr-2">
      <small className="mb-0.5 block text-xs text-muted-foreground">{label}</small>
      <b className="text-xl font-bold tabular-nums">{value ?? '—'}</b>
      {date && <span className="mt-0.5 block text-xs text-muted-foreground">{dayShort(date)}</span>}
    </div>
  )
}
