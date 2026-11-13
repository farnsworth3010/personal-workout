import type { ReactNode } from 'react'

import type { Equipment } from '@/entities/exercise'

export interface DetailsProps {
  exerciseId: string
  homeEquipment: readonly Equipment[]
  // An action after the steps, such as "Добавить в набор".
  children?: ReactNode
}
