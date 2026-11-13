import { useExercise } from '@/entities/exercise'
import { Loading, Sheet, SheetContent } from '@/shared/ui'

import type { DetailsProps } from '../../model/types'
import { ExerciseBody } from '../exercise-body'
import { ExerciseBodySkeleton } from '../exercise-body-skeleton'
import { ExerciseTitle } from '../exercise-title'

// A bottom sheet on phones and a centred dialog from 900px (SheetContent does both).
export function ExerciseDetails({
  exerciseId,
  homeEquipment,
  open,
  onOpenChange,
  children,
}: DetailsProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: exercise } = useExercise(exerciseId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={
          exercise ? (
            <ExerciseTitle exercise={exercise} homeEquipment={homeEquipment} />
          ) : (
            'Упражнение'
          )
        }
        className="gap-2"
      >
        {exercise ? (
          <>
            <ExerciseBody exercise={exercise} />
            {children}
          </>
        ) : (
          <Loading className="contents">
            <ExerciseBodySkeleton />
          </Loading>
        )}
      </SheetContent>
    </Sheet>
  )
}
