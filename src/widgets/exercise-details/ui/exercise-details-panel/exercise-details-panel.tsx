import { useExercise } from '@/entities/exercise'
import { Loading, Skeleton, Title } from '@/shared/ui'

import type { DetailsProps } from '../../model/types'
import { ExerciseBody } from '../exercise-body'
import { ExerciseBodySkeleton } from '../exercise-body-skeleton'
import { ExerciseTitle } from '../exercise-title'

// The desktop side panel of the catalog and the session.
export function ExerciseDetailsPanel({ exerciseId, homeEquipment, children }: DetailsProps) {
  const { data: exercise } = useExercise(exerciseId)

  return (
    <section
      aria-label="Описание упражнения"
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-6"
    >
      {exercise ? (
        <>
          <Title as="h2" className="text-[30px] leading-[1.15] min-[900px]:text-[30px]">
            <ExerciseTitle exercise={exercise} homeEquipment={homeEquipment} />
          </Title>
          <ExerciseBody exercise={exercise} />
          {children}
        </>
      ) : (
        <Loading className="contents">
          <Skeleton className="h-[35px] w-9/12" />
          <ExerciseBodySkeleton />
        </Loading>
      )}
    </section>
  )
}
