import type { Template as TemplateDocument, TemplateEntry, TemplateRef, WithId } from '@/shared/api'

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

// An own or ready-made set as lists show it, with the place its equipment needs.
export interface ListedTemplate {
  ref: TemplateRef
  name: string
  entries: TemplateEntry[]
  place: Place
}
