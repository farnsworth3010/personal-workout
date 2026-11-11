import * as React from 'react'
import { cn } from 'cn'

// Masks read only alpha, so any opaque token works. Both properties: Safari still needs the prefix.
const FADES = {
  end: 'linear-gradient(to right, var(--text) calc(100% - 40px), transparent)',
  both: 'linear-gradient(to right, transparent, var(--text) 14%, var(--text) 86%, transparent)',
}

function ChipRow({
  className,
  style,
  fade = 'end',
  ...props
}: React.ComponentProps<'div'> & { fade?: keyof typeof FADES }) {
  const ref = React.useRef<HTMLDivElement>(null)

  // Mouse wheels scroll only vertically; React wheel listeners are passive and cannot preventDefault.
  React.useEffect(() => {
    const row = ref.current
    if (!row) return
    let idle: ReturnType<typeof setTimeout> | undefined

    const scrollSideways = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      event.preventDefault()
      row.scrollLeft += event.deltaY

      // Snapping pauses while the wheel turns, or each small trackpad delta would be snapped away.
      row.style.scrollSnapType = 'none'
      clearTimeout(idle)
      idle = setTimeout(() => (row.style.scrollSnapType = ''), 150)
    }

    row.addEventListener('wheel', scrollSideways, { passive: false })

    return () => {
      row.removeEventListener('wheel', scrollSideways)
      clearTimeout(idle)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-slot="chip-row"
      className={cn(
        'flex min-w-0 [scrollbar-width:none] gap-1.5 overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden',
        fade === 'end' && 'pr-8',
        className,
      )}
      style={{ maskImage: FADES[fade], WebkitMaskImage: FADES[fade], ...style }}
      {...props}
    />
  )
}

export { ChipRow }
