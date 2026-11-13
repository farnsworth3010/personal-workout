import type { ReactNode } from 'react'

export function Step({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 border-b border-border py-2.5 text-[15px] leading-[1.45] [counter-increment:step] before:grid before:size-7 before:place-items-center before:rounded-full before:border before:border-primary before:text-[13px] before:font-bold before:text-primary before:content-[counter(step)] first:border-t">
      <div>
        {children}
        {hint && <small className="mt-0.5 block text-[13px] text-muted-foreground">{hint}</small>}
      </div>
    </li>
  )
}
