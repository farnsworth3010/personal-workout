import type { AddMode } from '@/entities/session'
import { Sheet, SheetContent } from '@/shared/ui'

import { addModes } from '../../config/add-modes'

interface AddModeSheetProps {
  name: string | undefined
  // At the end of the queue there is no current exercise to put it after or replace.
  canDefer: boolean
  onChoose: (mode: AddMode) => void
  onClose: () => void
}

export function AddModeSheet({ name, canDefer, onChoose, onClose }: AddModeSheetProps) {
  return (
    <Sheet
      open={name !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent title="Когда сделать?" description={name}>
        <div className="flex flex-col gap-2">
          {addModes
            .filter(([mode]) => canDefer || mode === 'now')
            .map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className="min-h-12 rounded-md border border-border bg-surface-2 text-[15px] font-semibold first:border-primary first:bg-primary first:text-on-accent"
                onClick={() => onChoose(mode)}
              >
                {label}
              </button>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
