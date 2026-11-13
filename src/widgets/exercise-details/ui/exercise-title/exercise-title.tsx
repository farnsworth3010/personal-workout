import { isGymOnly, type Equipment, type Exercise } from '@/entities/exercise'
import { Badge } from '@/shared/ui'

export function ExerciseTitle({
  exercise,
  homeEquipment,
}: {
  exercise: Exercise
  homeEquipment: readonly Equipment[]
}) {
  return (
    <>
      {exercise.name}
      {isGymOnly(exercise, homeEquipment) && <Badge className="ml-1.5 align-[3px]">зал</Badge>}
    </>
  )
}
