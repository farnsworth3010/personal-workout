import type { SetValues } from '@/entities/session'
import type { Exercise } from '@/entities/exercise'
import { equipmentLabels, muscleGroupsText } from '@/entities/exercise'

const kg = (n: number) => n.toLocaleString('ru')

// "10 × 60", "12", "45 с"; withUnit adds "кг" after a weight.
export function setText({ reps, weightKg, durationSec }: SetValues, withUnit = false) {
  if (durationSec !== undefined) return `${durationSec} с`

  if (weightKg === undefined || weightKg === 0) return String(reps ?? 0)

  return `${reps ?? 0} × ${kg(weightKg)}${withUnit ? ' кг' : ''}`
}

// "Грудь · трицепс, плечи · штанга", as on the prototype's card.
export function tagsText(exercise: Exercise) {
  return [
    muscleGroupsText(exercise.primaryMuscles, { capitalizeFirst: true }),
    muscleGroupsText(exercise.secondaryMuscles),
    exercise.equipment && equipmentLabels[exercise.equipment].toLocaleLowerCase('ru'),
  ]
    .filter(Boolean)
    .join(' · ')
}
