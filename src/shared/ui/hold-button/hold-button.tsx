import * as React from 'react'
import { cn } from 'cn'

type HoldButtonProps = Omit<React.ComponentProps<'button'>, 'children' | 'onClick'> & {
  label: React.ReactNode
  onConfirm: () => void
  holdMs?: number
  // Destructive actions: mouse, pen and a held Space or Enter must hold too, with a countdown.
  holdAlways?: boolean
}

const HINT_MS = 1200

const HOLD_KEYS = new Set([' ', 'Enter'])

// An accidental touch tap must not fire, so touch needs a hold; mouse and keyboard act at once.
function HoldButton({
  label,
  onConfirm,
  holdMs = 1000,
  holdAlways = false,
  className,
  ...props
}: HoldButtonProps) {
  const pointer = React.useRef('')
  const holdTimer = React.useRef<number>(undefined)
  const hintTimer = React.useRef<number>(undefined)
  const tick = React.useRef<number>(undefined)
  const [holding, setHolding] = React.useState(false)
  const [hint, setHint] = React.useState(false)
  // Whole seconds left; the fill alone is instant under reduced motion (app/styles/motion.css).
  const [left, setLeft] = React.useState(0)

  React.useEffect(
    () => () => {
      clearTimeout(holdTimer.current)
      clearTimeout(hintTimer.current)
      clearInterval(tick.current)
    },
    [],
  )

  const stop = () => {
    clearTimeout(holdTimer.current)
    clearInterval(tick.current)
    holdTimer.current = undefined
    setHolding(false)
  }

  const start = () => {
    clearTimeout(hintTimer.current)
    setHint(false)
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      stop()
      onConfirm()
    }, holdMs)

    if (!holdAlways) return

    setLeft(Math.ceil(holdMs / 1000))
    tick.current = window.setInterval(() => setLeft((n) => n - 1), 1000)
  }

  const release = () => {
    if (holdTimer.current === undefined) return

    stop()
    setHint(true)
    hintTimer.current = window.setTimeout(() => setHint(false), HINT_MS)
  }

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    pointer.current = event.pointerType

    if (event.pointerType !== 'touch' && !holdAlways) return

    // A mouse released outside the button must still end the hold (jsdom has no pointer capture).
    const target = event.currentTarget
    if (event.pointerType !== 'touch' && 'setPointerCapture' in target)
      target.setPointerCapture(event.pointerId)
    start()
  }

  return (
    <button
      type="button"
      data-slot="hold-button"
      data-holding={holding || undefined}
      className={cn('relative overflow-hidden select-none [-webkit-touch-callout:none]', className)}
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        if (!holdAlways || !HOLD_KEYS.has(event.key)) return

        // Enter would click at once and Space on release; the hold replaces both.
        event.preventDefault()
        if (!event.repeat) start()
      }}
      onKeyUp={(event) => {
        if (holdAlways && HOLD_KEYS.has(event.key)) release()
      }}
      onBlur={stop}
      // A long press would open the context menu on Android.
      onContextMenu={(event) => {
        if (pointer.current === 'touch') event.preventDefault()
      }}
      // The click after a touch is suppressed; keyboard clicks have detail 0. The click's own
      // pointerType covers a button mounted under the finger during the hold, which saw no pointerdown.
      onClick={(event) => {
        const type = (event.nativeEvent as Partial<PointerEvent>).pointerType ?? pointer.current

        if (!holdAlways && (type !== 'touch' || event.detail === 0)) onConfirm()
      }}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 origin-left scale-x-0 bg-primary/25',
          holding && 'scale-x-100 transition-transform ease-linear',
        )}
        style={holding ? { transitionDuration: `${holdMs}ms` } : undefined}
      />
      <span className="relative">
        {hint ? 'Удерживайте' : holding && holdAlways ? `Держите… ${String(left)} с` : label}
      </span>
    </button>
  )
}

export { HoldButton }
