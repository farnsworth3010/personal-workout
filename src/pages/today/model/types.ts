import type { ListedTemplate } from '@/entities/template'

import type { todayPlan } from './today-plan'

export interface TodaySet {
  set: ListedTemplate | undefined
  doneAt: Date | null | undefined
  workoutId?: string
  // Not undefined when the set is the other place's variant of the planned one.
  swappedTo?: string
}

export type Week = ReturnType<typeof todayPlan>['week']
