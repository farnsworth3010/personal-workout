import * as React from 'react'

function Loading({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-label="Загрузка" aria-busy className={className}>
      <span className="sr-only">Загрузка…</span>
      {children}
    </div>
  )
}

export { Loading }
