import { refKey, type ListedTemplate } from '@/entities/template'
import { Sheet, SheetContent } from '@/shared/ui'

import { SetList } from '../set-list'

interface OtherWorkoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sets: readonly ListedTemplate[]
  // refKeys of today's planned sets.
  planned: ReadonlySet<string>
  onPick: (set: ListedTemplate) => void
}

export function OtherWorkoutSheet({
  open,
  onOpenChange,
  sets,
  planned,
  onPick,
}: OtherWorkoutSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Другая тренировка" description="Расписание не изменится">
        <SetList
          hold
          sets={sets}
          onPick={onPick}
          mark={(set) => (planned.has(refKey(set.ref)) ? { text: 'По плану' } : null)}
        />
      </SheetContent>
    </Sheet>
  )
}
