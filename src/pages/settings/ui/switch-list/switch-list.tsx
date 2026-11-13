import { Skeleton, Switch } from '@/shared/ui'

interface SwitchListProps<K extends string> {
  idPrefix: string
  items: readonly { key: K; label: string; hint: string }[]
  loaded: boolean
  checked: (key: K) => boolean
  onChange: (key: K, checked: boolean) => void
}

export function SwitchList<K extends string>({
  idPrefix,
  items,
  loaded,
  checked,
  onChange,
}: SwitchListProps<K>) {
  return (
    <ul>
      {items.map(({ key, label, hint }) => (
        <li key={key} className="border-b border-border first:border-t">
          <label
            htmlFor={`${idPrefix}-${key}`}
            className="grid min-h-16 cursor-pointer grid-cols-[1fr_auto] items-center gap-4 py-2.5"
          >
            <span>
              {label}
              <small className="mt-0.5 block text-[13px] leading-[1.4] text-muted-foreground">
                {hint}
              </small>
            </span>
            {loaded ? (
              <Switch
                id={`${idPrefix}-${key}`}
                checked={checked(key)}
                onCheckedChange={(next) => onChange(key, next)}
              />
            ) : (
              <Skeleton className="h-8 w-[52px] rounded-full" />
            )}
          </label>
        </li>
      ))}
    </ul>
  )
}
