import * as React from 'react'

import { Title } from '../title'

function PageHeader({
  title,
  subtitle,
  className,
  ...props
}: Omit<React.ComponentProps<'header'>, 'title'> & {
  title: React.ReactNode
  subtitle?: React.ReactNode
}) {
  return (
    <header data-slot="page-header" className={className} {...props}>
      <Title>{title}</Title>
      {subtitle !== undefined && (
        <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
      )}
    </header>
  )
}

export { PageHeader }
