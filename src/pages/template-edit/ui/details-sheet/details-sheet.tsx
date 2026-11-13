import type { Equipment } from '@/shared/api'
import { Button } from '@/shared/ui'
import { ExerciseDetails } from '@/widgets/exercise-details'

interface DetailsSheetProps {
  exerciseId: string
  open: boolean
  homeEquipment: Equipment[]
  onOpenChange: (open: boolean) => void
  onAdd: () => void
}

// The picked exercise's description with «Добавить в набор».
export function DetailsSheet({
  exerciseId,
  open,
  homeEquipment,
  onOpenChange,
  onAdd,
}: DetailsSheetProps) {
  return (
    <ExerciseDetails
      exerciseId={exerciseId}
      homeEquipment={homeEquipment}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Button size="cta" className="mt-2.5 min-h-14 text-[17px]" onClick={onAdd}>
        Добавить в набор
      </Button>
    </ExerciseDetails>
  )
}
