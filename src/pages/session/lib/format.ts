import type { SetValues } from '@/entities/session'
import type { Exercise } from '@/entities/exercise'
import { equipmentLabels, muscleLabels } from '@/entities/exercise'

const kg = (n: number) => n.toLocaleString('ru')

// "10 × 60", "12", "45 с"; withUnit adds "кг" after a weight.
export function setText({ reps, weightKg, durationSec }: SetValues, withUnit = false) {
  if (durationSec !== undefined) return `${durationSec} с`

  if (weightKg === undefined || weightKg === 0) return String(reps ?? 0)

  return `${reps ?? 0} × ${kg(weightKg)}${withUnit ? ' кг' : ''}`
}

const lower = (text: string) => text.toLowerCase()

// "Грудь · трицепс, плечи · штанга", as on the prototype's card.
export function tagsText(exercise: Exercise) {
  const [first = '', ...rest] = exercise.primaryMuscles.map((m) => muscleLabels[m])

  return [
    [first, ...rest.map(lower)].join(', '),
    exercise.secondaryMuscles.map((m) => lower(muscleLabels[m])).join(', '),
    exercise.equipment && lower(equipmentLabels[exercise.equipment]),
  ]
    .filter(Boolean)
    .join(' · ')
}
