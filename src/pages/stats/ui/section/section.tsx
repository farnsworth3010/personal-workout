import type { ReactNode } from 'react'

import { cn } from '@/shared/lib'

export function Section({
  id,
  title,
  sub,
  className,
  children,
}: {
  id: string
  title: string
  sub?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'mt-4 flex min-w-0 flex-col gap-3.5 border-t border-border pt-5 pb-2',
        className,
      )}
    >
      <div>
        <h2 id={id} className="text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase">
          {title}
        </h2>
        {sub !== undefined && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  )
}
