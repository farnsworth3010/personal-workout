import type { Template as TemplateDocument, TemplateEntry, WithId } from '@/shared/api'

// A person's set, stored at /users/{uid}/templates/{id}.
export type Template = WithId<TemplateDocument>

export type Place = 'home' | 'gym'

// A ready-made set from /catalog/templates.json.
export interface ReadyTemplate {
  id: string
  name: string
  place: Place
  pairId?: string
  entries: TemplateEntry[]
}
