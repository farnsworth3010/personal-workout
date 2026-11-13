import * as React from 'react'
import { cn } from 'cn'

import { Heading } from '../heading'

interface SectionProps {
  // The heading's id, which labels the section.
  id: string
  title: string
  sub?: React.ReactNode
  className?: string
  children: React.ReactNode
}

// A titled block of a screen, separated from the one above by a rule.
function Section({ id, title, sub, className, children }: SectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'mt-4 flex min-w-0 flex-col gap-3.5 border-t border-border pt-5 pb-2',
        className,
      )}
    >
      <div>
        <Heading id={id}>{title}</Heading>
        {sub !== undefined && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  )
}

export { Section }
