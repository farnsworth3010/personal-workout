import * as React from 'react'
import { cn } from 'cn'

// The uppercase section heading of every screen: "Упражнения", "Таймеры", "Мои наборы".
function Heading({
  as: Tag = 'h2',
  className,
  ...props
}: React.ComponentProps<'h2'> & { as?: 'h2' | 'h3' | 'p' }) {
  return (
    <Tag
      data-slot="heading"
      className={cn(
        'text-lg leading-[1.15] font-extrabold tracking-[-0.02em] uppercase',
        className,
      )}
      {...props}
    />
  )
}

export { Heading }
