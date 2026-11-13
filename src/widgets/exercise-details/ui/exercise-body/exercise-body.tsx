import { equipmentLabels, kindLabels, muscleLine, type Exercise } from '@/entities/exercise'

import { Movement } from '../movement'

// The body of exercises.html's description: the movement, muscles, equipment, technique steps.
export function ExerciseBody({ exercise }: { exercise: Exercise }) {
  return (
    <>
      <Movement exercise={exercise} />
      <p className="text-sm leading-[1.4]">
        <span className="text-muted-foreground">Мышцы:</span> {muscleLine(exercise)}
      </p>
      <p className="text-sm leading-[1.4]">
        <span className="text-muted-foreground">Оборудование:</span>{' '}
        {equipmentLabels[exercise.equipment ?? 'body only'].toLocaleLowerCase('ru')} ·{' '}
        {kindLabels[exercise.kind]}
      </p>
      <ol className="mt-1.5 flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[1.4]">
        {exercise.instructions.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </>
  )
}
