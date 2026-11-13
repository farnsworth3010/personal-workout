import { isGymOnly, type Equipment, type Exercise } from '@/entities/exercise'
import { Button } from '@/shared/ui'

import { exercisesWord } from '../../lib/format'
import { ExerciseRow } from '../exercise-row'

interface CatalogListProps {
  visible: readonly Exercise[]
  total: number
  count: number
  current: string | null
  homeEquipment: readonly Equipment[]
  onOpen: (id: string) => void
  onMore: () => void
}

// The found count, the first `count` rows and «Показать ещё».
export function CatalogList({
  visible,
  total,
  count,
  current,
  homeEquipment,
  onOpen,
  onMore,
}: CatalogListProps) {
  return (
    <>
      <p aria-live="polite" className="text-[13px] text-muted-foreground tabular-nums">
        {visible.length === total
          ? `Показаны все ${exercisesWord(total)}`
          : `Найдено: ${exercisesWord(visible.length)}`}
      </p>
      <ul className="border-t border-border">
        {visible.slice(0, count).map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            gym={isGymOnly(exercise, homeEquipment)}
            current={exercise.id === current}
            onOpen={onOpen}
          />
        ))}
      </ul>
      {visible.length > count && (
        <Button variant="outline" className="min-h-11 self-start rounded-lg px-4" onClick={onMore}>
          Показать ещё
        </Button>
      )}
    </>
  )
}
