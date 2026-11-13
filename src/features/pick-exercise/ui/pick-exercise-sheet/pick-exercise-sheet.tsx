import { useRef } from 'react'

import type { Equipment } from '@/entities/exercise'
import { Sheet, SheetContent } from '@/shared/ui'

import { PickResults } from '../pick-results'

interface PickExerciseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (exerciseId: string) => void
  homeEquipment: readonly Equipment[]
  // How many times each exercise is already in the set; a set may hold one exercise twice.
  counts?: Readonly<Record<string, number>>
  // Opens the exercise's description above the sheet; the page composes it, a feature cannot.
  onDetails?: (exerciseId: string) => void
  title?: string
}

// template-edit.html's catalog search: a fixed height so the list does not jump while it filters.
export function PickExerciseSheet({
  open,
  onOpenChange,
  onPick,
  homeEquipment,
  counts = {},
  onDetails,
  title = 'Добавить упражнение',
}: PickExerciseSheetProps) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={title}
        className="h-[85dvh] overflow-hidden min-[900px]:h-[80vh] min-[900px]:max-w-[560px]"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          input.current?.focus()
        }}
      >
        <PickResults
          input={input}
          onPick={onPick}
          onDetails={onDetails}
          homeEquipment={homeEquipment}
          counts={counts}
        />
      </SheetContent>
    </Sheet>
  )
}
