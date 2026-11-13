import type { weekMuscleLoad } from './muscle-load'

export interface ChartPoint {
  date: Date
  value: number
}

export interface ChartSeries {
  label: string
  tone: 'primary' | 'foreground'
  points: ChartPoint[]
  dots?: boolean
}

export type ChartRow = { t: number } & Partial<Record<string, number>>

export type Metric = 'weight' | 'volume' | 'reps'

export type WeekLoad = ReturnType<typeof weekMuscleLoad>

export type FigureView = 'front' | 'back'
