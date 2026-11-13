import { useState } from 'react'
import { Link } from 'react-router'

import type { Equipment } from '@/entities/exercise'
import type { ListedTemplate } from '@/entities/template'
import { Button, HoldButton, Sheet, SheetContent } from '@/shared/ui'
import { ExerciseDetails } from '@/widgets/exercise-details'
import { SetExercises } from '@/widgets/set-exercises'

// Read-only view of one set: what it holds, then start it, copy a ready one or edit an own one.
export function SetSheet({
  set,
  summary,
  homeEquipment,
  copied,
  onClose,
  onStart,
  onCopy,
}: {
  set: ListedTemplate | null
  // Place, time and muscles, as the list row shows them.
  summary: string
  homeEquipment: Equipment[]
  copied: boolean
  onClose: () => void
  onStart: (set: ListedTemplate) => void
  onCopy: (set: ListedTemplate) => void
}) {
  const [details, setDetails] = useState<{ id: string; open: boolean } | null>(null)

  return (
    <>
      <Sheet open={set !== null} onOpenChange={(open) => !open && onClose()}>
        {set && (
          <SheetContent title={set.name} description={summary}>
            <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4 min-[900px]:-mx-7 min-[900px]:px-7">
              <SetExercises
                name={set.name}
                entries={set.entries}
                onExercise={(id) => setDetails({ id, open: true })}
              />
            </div>
            <HoldButton
              label="Начать"
              aria-label={`Начать «${set.name}»`}
              variant="cta"
              onConfirm={() => onStart(set)}
            />
            {set.ref.source === 'own' ? (
              <Button asChild variant="outline" size="ghost">
                <Link to={`/templates/${set.ref.id}`}>Изменить</Link>
              </Button>
            ) : (
              <Button variant="outline" size="ghost" disabled={copied} onClick={() => onCopy(set)}>
                {copied ? 'Скопирован' : 'Скопировать к себе'}
              </Button>
            )}
          </SheetContent>
        )}
      </Sheet>

      {details && (
        <ExerciseDetails
          exerciseId={details.id}
          homeEquipment={homeEquipment}
          open={details.open}
          onOpenChange={(open) => setDetails({ ...details, open })}
        />
      )}
    </>
  )
}
