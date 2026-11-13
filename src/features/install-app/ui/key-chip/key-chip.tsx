import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// The browser's own control drawn inline, so a step reads like the screen it points at.
export function KeyChip({ icon: Icon, children }: { icon: LucideIcon; children?: ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-0.5 align-[1px] font-semibold whitespace-nowrap">
      <Icon aria-hidden className="size-4 text-primary" />
      {children}
    </span>
  )
}
