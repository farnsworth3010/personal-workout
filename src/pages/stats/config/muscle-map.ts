import type { LoadLevel } from '../model/muscle-load'
import type { FigureView } from '../model/types'

export const levelFill: Record<LoadLevel, string> = {
  0: 'fill-surface-2',
  1: 'fill-primary/35',
  2: 'fill-primary/65',
  3: 'fill-primary',
}

export const viewLabels: Record<FigureView, [aria: string, caption: string]> = {
  front: ['Тело спереди', 'Спереди'],
  back: ['Тело сзади', 'Сзади'],
}

export const legend: [LoadLevel, string][] = [
  [0, 'нет'],
  [1, '1–9'],
  [2, '10–20'],
  [3, '20+ подходов'],
]

export const swatchOpacity: Record<LoadLevel, string> = {
  0: 'hidden',
  1: 'opacity-35',
  2: 'opacity-65',
  3: '',
}
