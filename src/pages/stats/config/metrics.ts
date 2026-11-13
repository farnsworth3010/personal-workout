import type { ProgressPoint } from '../model/progress'
import type { Metric } from '../model/types'

export const metrics: Record<
  Metric,
  { label: string; caption: string; unit: string; get: (p: ProgressPoint) => number }
> = {
  weight: {
    label: 'Вес',
    caption: 'Рабочий вес в лучшем подходе',
    unit: ' кг',
    get: (p) => p.topWeightKg,
  },
  volume: { label: 'Объём', caption: 'Объём за тренировку', unit: '', get: (p) => p.volumeKg },
  reps: { label: 'Повторы', caption: 'Повторов за тренировку', unit: '', get: (p) => p.reps },
}
