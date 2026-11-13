import type { ReactNode } from 'react'

import { Title } from '@/shared/ui'

import { BackLink } from '../back-link'

// The back link and the title around every state before the editor opens.
export function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <BackLink />
      <Title className="min-[900px]:text-[32px]">{title}</Title>
      {children}
    </>
  )
}
