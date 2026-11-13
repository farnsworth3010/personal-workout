import type { Equipment } from '@/entities/exercise'
import { ExerciseDetailsPanel } from '@/widgets/exercise-details'

import { AddToSet } from '../add-to-set'

interface DetailsPanelProps {
  uid: string
  exerciseId: string | null
  homeEquipment: readonly Equipment[]
  loaded: boolean
}

// The desktop side panel with the current exercise, or a hint while nothing is listed.
export function DetailsPanel({ uid, exerciseId, homeEquipment, loaded }: DetailsPanelProps) {
  return (
    <div className="sticky top-8 max-h-[calc(100dvh-64px)] overflow-y-auto">
      {exerciseId ? (
        <ExerciseDetailsPanel exerciseId={exerciseId} homeEquipment={homeEquipment}>
          <AddToSet uid={uid} exerciseId={exerciseId} homeEquipment={homeEquipment} />
        </ExerciseDetailsPanel>
      ) : (
        loaded && (
          <p className="rounded-lg border border-border bg-surface p-6 text-[13px] text-muted-foreground">
            Выберите упражнение в списке, чтобы увидеть технику.
          </p>
        )
      )}
    </div>
  )
}
