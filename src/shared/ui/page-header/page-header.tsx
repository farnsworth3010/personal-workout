import * as React from 'react'

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
      <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[40px]">
        {title}
      </h1>
      {subtitle !== undefined && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  )
}

export { PageHeader }
