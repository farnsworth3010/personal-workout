import type { ReactNode } from 'react'

interface TopInsetProps {
  children: ReactNode
}

// Below Safari's top bar and its blur, which reaches past the inset; the offline strip pads it itself.
export function TopInset({ children }: TopInsetProps) {
  return (
    <div className="max-[900px]:pt-[calc(env(safe-area-inset-top)+16px)] max-[900px]:[[data-offline-strip]+&]:pt-0">
      {children}
    </div>
  )
}
