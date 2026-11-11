import { deleteDoc, doc, orderBy, query, setDoc, Timestamp } from 'firebase/firestore'

import {
  fireWrite,
  querySource,
  templateRef,
  templatesRef,
  useSnapshotQuery,
  type TemplateEntry,
} from '@/shared/api'

import type { ReadyTemplate, Template } from '../model/types'

export interface TemplateDraft {
  name: string
  entries: TemplateEntry[]
}

export const ownTemplatesQueryKey = (uid: string) => ['templates', uid] as const

export const useOwnTemplates = (uid: string) =>
  useSnapshotQuery(
    ownTemplatesQueryKey(uid),
    querySource(query(templatesRef(uid), orderBy('createdAt'))),
  )

// The id is generated on the client, so the write and the navigation work offline.
export function createTemplate(
  uid: string,
  draft: TemplateDraft,
  copiedFrom: string | null = null,
) {
  const ref = doc(templatesRef(uid))
  const now = Timestamp.now()

  fireWrite(() => setDoc(ref, { ...draft, copiedFrom, createdAt: now, updatedAt: now }))

  return ref.id
}

export const copyTemplate = (uid: string, ready: Pick<ReadyTemplate, 'id' | 'name' | 'entries'>) =>
  createTemplate(uid, { name: ready.name, entries: ready.entries }, ready.id)

// Writes the whole document: the converter validates complete documents only.
export function updateTemplate(uid: string, template: Template, draft: TemplateDraft) {
  const { id, copiedFrom, createdAt } = template

  fireWrite(() =>
    setDoc(templateRef(uid, id), { ...draft, copiedFrom, createdAt, updatedAt: Timestamp.now() }),
  )
}

export function deleteTemplate(uid: string, templateId: string) {
  fireWrite(() => deleteDoc(templateRef(uid, templateId)))
}
