import type { ReactNode } from 'react'

import { cn } from '@/shared/lib'
import { Section } from '@/shared/ui'

interface SettingsSectionProps {
  id: string
  title: string
  className?: string
  children: ReactNode
}

// The settings screen packs its sections tighter than the shared Section.
export function SettingsSection({ id, title, className, children }: SettingsSectionProps) {
  return (
    <Section id={id} title={title} className={cn('mt-0 gap-3 pb-1', className)}>
      {children}
    </Section>
  )
}
