import type { ExerciseKind } from '@/shared/api'
import { decimalComma } from '@/shared/lib'

export const kindNote = (kind: ExerciseKind, lastKg: number | undefined) =>
  ({
    strength: `Силовое · ${lastKg ? `в прошлый раз ${decimalComma(lastKg)} кг` : 'вес подставится после первой тренировки'}`,
    bodyweight: 'С весом тела · доп. вес по желанию',
    timed: 'На время',
    cardio: 'Кардио',
  })[kind]
