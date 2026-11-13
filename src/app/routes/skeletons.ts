import type { ComponentType } from 'react'
import { matchPath } from 'react-router'

import {
  ExercisesSkeleton,
  FinishSkeleton,
  SessionSkeleton,
  SettingsSkeleton,
  StatsSkeleton,
  TemplateEditSkeleton,
  TemplatesSkeleton,
  TodaySkeleton,
  WorkoutSkeleton,
} from '@/widgets/page-skeletons'

// Hand-kept, not derived from routes/index.ts: that file imports the layouts, which import this one
// through useRouteSkeleton, so importing routes/index.ts back here would cycle.
const table: [pattern: string, Skeleton: ComponentType][] = [
  ['/', TodaySkeleton],
  ['/templates', TemplatesSkeleton],
  ['/templates/new', TemplateEditSkeleton],
  ['/templates/:id', TemplateEditSkeleton],
  ['/exercises', ExercisesSkeleton],
  ['/stats', StatsSkeleton],
  ['/workouts/:id', WorkoutSkeleton],
  ['/settings', SettingsSkeleton],
  ['/session', SessionSkeleton],
  ['/session/finish', FinishSkeleton],
]

export const skeletonFor = (pathname: string) =>
  table.find(([pattern]) => matchPath(pattern, pathname))?.[1] ?? null
