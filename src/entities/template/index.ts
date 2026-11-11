export {
  copyTemplate,
  createTemplate,
  deleteTemplate,
  ownTemplatesQueryKey,
  updateTemplate,
  useOwnTemplates,
  type TemplateDraft,
} from './api/own-templates'
export { readyTemplatesQuery, useReadyTemplates } from './api/ready-templates'
export {
  estimateDurationMin,
  gymOnlyCount,
  muscleGroupsOf,
  needsGym,
  placeOf,
  type ExerciseFacts,
} from './lib/derive'
export type { TemplateEntry, TemplateRef } from '@/shared/api'
export type { Place, ReadyTemplate, Template } from './model/types'
