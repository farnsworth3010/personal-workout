import type { Muscle } from '@/shared/api'
import { capitalize } from '@/shared/lib'

import { muscleLabels } from '../config/labels'
import type { Exercise } from '../model/types'

interface MusclesTextOptions {
  // Only the first n muscles.
  limit?: number
  capitalizeFirst?: boolean
}

/** "спина, поясница", or "Спина, поясница" with capitalizeFirst. */
export function muscleGroupsText(
  muscles: readonly Muscle[],
  { limit, capitalizeFirst = false }: MusclesTextOptions = {},
) {
  const text = muscles
    .slice(0, limit)
    .map((m) => muscleLabels[m].toLocaleLowerCase('ru'))
    .join(', ')

  return capitalizeFirst ? capitalize(text) : text
}

/** "грудь, трицепс · плечи": primary muscles, then secondary ones. */
export const muscleLine = (exercise: Pick<Exercise, 'primaryMuscles' | 'secondaryMuscles'>) =>
  [exercise.primaryMuscles, exercise.secondaryMuscles]
    .filter((muscles) => muscles.length > 0)
    .map((muscles) => muscleGroupsText(muscles))
    .join(' · ')
