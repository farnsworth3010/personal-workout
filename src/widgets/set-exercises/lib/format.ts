import type { TemplateEntry } from '@/entities/template'

export const planLine = (entry: TemplateEntry) =>
  entry.durationSec === undefined
    ? `${entry.sets} × ${entry.reps ?? 0}`
    : `${entry.sets} × ${entry.durationSec} с`
