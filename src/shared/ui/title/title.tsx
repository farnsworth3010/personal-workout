import * as React from 'react'
import { cn } from 'cn'

// The big uppercase title of a page or a card; pass a desktop size in className to change the 40px.
function Title({
  as: Tag = 'h1',
  className,
  ...props
}: React.ComponentProps<'h1'> & { as?: 'h1' | 'h2' | 'p' | 'span' }) {
  return (
    <Tag
      data-slot="title"
      className={cn(
        'text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[40px]',
        className,
      )}
      {...props}
    />
  )
}

export { Title }
