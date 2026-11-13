interface CatalogSearchProps {
  value: string
  onChange: (value: string) => void
}

export function CatalogSearch({ value, onChange }: CatalogSearchProps) {
  return (
    <label>
      <span className="sr-only">Поиск по каталогу</span>
      <input
        type="search"
        value={value}
        placeholder="Название, мышца, оборудование"
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-[17px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
