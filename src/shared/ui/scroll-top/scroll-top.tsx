import * as React from 'react'
import { cn } from 'cn'
import { ArrowUp } from 'lucide-react'

import { prefersStill } from '@/shared/lib'

const subscribe = (onChange: () => void) => {
  addEventListener('scroll', onChange, { passive: true })
  addEventListener('resize', onChange)

  return () => {
    removeEventListener('scroll', onChange)
    removeEventListener('resize', onChange)
  }
}

const farDown = () => window.scrollY > 0.8 * window.innerHeight

// "Наверх" after about one screen of scrolling, above the bottom bar on phones.
// It stays mounted so it can fade out; inert keeps the hidden button out of focus and the tree.
function ScrollTop({ className }: { className?: string }) {
  const far = React.useSyncExternalStore(subscribe, farDown, () => false)

  return (
    <button
      type="button"
      data-slot="scroll-top"
      inert={!far}
      className={cn(
        'fixed right-4 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-4 text-[15px] font-semibold text-foreground shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring min-[900px]:right-8 min-[900px]:bottom-6',
        // motion.css makes this instant with reduced motion or the animations switch off.
        'transition-[opacity,translate] duration-200 ease-out',
        far ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
      onClick={() => scrollTo({ top: 0, behavior: prefersStill() ? 'instant' : 'smooth' })}
    >
      <ArrowUp aria-hidden="true" className="size-4" />
      Наверх
    </button>
  )
}

export { ScrollTop }
