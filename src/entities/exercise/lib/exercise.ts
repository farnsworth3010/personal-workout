import type { Equipment } from '@/shared/api'

import type { Exercise } from '../model/types'

// Exercises without equipment in the dataset are mostly stretches and drills, doable anywhere.
export function isGymOnly(exercise: Exercise, homeEquipment: readonly Equipment[]): boolean {
  const { equipment } = exercise

  return equipment !== null && equipment !== 'body only' && !homeEquipment.includes(equipment)
}

export function photoUrl(exercise: Exercise, n: number): string | undefined {
  const path = exercise.images.at(n)

  return path === undefined ? undefined : `/catalog/images/${path}`
}
