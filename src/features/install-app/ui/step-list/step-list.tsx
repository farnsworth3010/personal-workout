import type { ReactNode } from 'react'

export function StepList({ children }: { children: ReactNode }) {
  return <ol className="flex flex-col [counter-reset:step]">{children}</ol>
}
