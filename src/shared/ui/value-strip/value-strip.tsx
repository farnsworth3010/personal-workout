import * as React from 'react'
import { cn } from 'cn'

import { Chip } from '../chip'
import { ChipRow } from '../chip-row'

interface ValueStripProps {
  label: string
  // Undefined: nothing picked yet; a leading "своё" chip opens the exact input.
  value: number | undefined
  onChange: (value: number) => void
  max: number
  step: number
  min?: number
  // Rejects fractional input, e.g. for reps.
  integer?: boolean
  format?: (value: number) => string
  className?: string
}

const round = (n: number) => Math.round(n * 100) / 100

const defaultFormat = (n: number) => n.toLocaleString('ru')

// Five chips fit the width; the spacers let the first and last chips reach the centre.
const CHIP = 'shrink-0 grow-0 basis-(--chip) min-w-0 min-h-13 px-0 text-[17px] snap-center'

function ValueStrip({
  label,
  value,
  onChange,
  max,
  step,
  min = 0,
  integer = false,
  format = defaultFormat,
  className,
}: ValueStripProps) {
  const selected = React.useRef<HTMLButtonElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const [editing, setEditing] = React.useState(false)

  const values = React.useMemo(() => {
    const grid = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) =>
      round(min + i * step),
    )

    // An off-grid value gets its own chip, in sorted order.
    return value === undefined || grid.includes(value)
      ? grid
      : [...grid, value].sort((a, b) => a - b)
  }, [min, max, step, value])

  React.useLayoutEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()

      return
    }

    const chip = selected.current
    const strip = chip?.parentElement

    if (!chip || !strip) return

    strip.scrollLeft = chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2
  }, [value, editing])

  const commit = (text: string) => {
    setEditing(false)

    const n = Number(text.trim().replace(',', '.'))
    const valid = text.trim() !== '' && Number.isFinite(n) && n >= min && n <= max

    if (valid && (!integer || Number.isInteger(n))) onChange(round(n))
  }

  const editor = (text: string, key?: number) => (
    <input
      key={key}
      ref={input}
      inputMode="decimal"
      aria-label={label}
      defaultValue={text}
      className={cn(
        CHIP,
        'rounded-lg border-2 border-primary bg-surface text-center font-semibold text-foreground outline-none',
      )}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      onBlur={(event) => commit(event.currentTarget.value)}
    />
  )

  return (
    <ChipRow
      fade="both"
      role="group"
      aria-label={label}
      className={cn(
        'relative snap-x snap-proximity [--chip:calc((100%-4*0.375rem)/5)]',
        "before:shrink-0 before:basis-[calc((100%-var(--chip))/2-0.375rem)] before:content-['']",
        "after:shrink-0 after:basis-[calc((100%-var(--chip))/2-0.375rem)] after:content-['']",
        className,
      )}
    >
      {value === undefined &&
        (editing ? (
          editor('')
        ) : (
          <Chip
            ref={selected}
            pressed={false}
            aria-label={`${label}: ввести своё`}
            className={cn(CHIP, 'border-dashed text-[15px] text-muted-foreground')}
            onClick={() => setEditing(true)}
          >
            своё
          </Chip>
        ))}
      {values.map((n) =>
        n === value && editing ? (
          editor(String(n).replace('.', ','), n)
        ) : (
          <Chip
            key={n}
            ref={n === value ? selected : undefined}
            pressed={n === value}
            className={CHIP}
            onClick={() => (n === value ? setEditing(true) : onChange(n))}
          >
            {format(n)}
          </Chip>
        ),
      )}
    </ChipRow>
  )
}

export { ValueStrip }
