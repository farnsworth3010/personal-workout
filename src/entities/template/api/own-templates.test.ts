import { deleteDoc, setDoc, Timestamp, type DocumentReference } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { templateSchema, type Template as TemplateDocument } from '@/shared/api'

import type { ReadyTemplate, Template } from '../model/types'
import { copyTemplate, createTemplate, deleteTemplate, updateTemplate } from './own-templates'

vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  setDoc: vi.fn(() => new Promise<void>(() => undefined)),
  deleteDoc: vi.fn(() => new Promise<void>(() => undefined)),
}))

const uid = 'user-1'
const entries = [{ exerciseId: 'Pushups', sets: 3, reps: 12, restSec: 60 }]

const written = (call = 0) => {
  const [ref, data] = vi.mocked(setDoc).mock.calls[call] ?? []

  return { path: (ref as DocumentReference).path, data: data as TemplateDocument }
}

describe('own templates', () => {
  beforeEach(() => {
    vi.mocked(setDoc).mockClear()
    vi.mocked(deleteDoc).mockClear()
  })

  it('creates a whole valid document under the returned client id', () => {
    const id = createTemplate(uid, { name: 'Утро', entries })

    const { path, data } = written()
    expect(path).toBe(`users/${uid}/templates/${id}`)
    expect(templateSchema.parse(data)).toEqual(data)
    expect(data).toMatchObject({ name: 'Утро', entries, copiedFrom: null })
    expect(data.createdAt).toEqual(data.updatedAt)
  })

  it('copies a ready-made set and remembers its id', () => {
    const ready: ReadyTemplate = { id: 'home-basic', name: 'Дом', place: 'home', entries }

    copyTemplate(uid, ready)

    expect(written().data).toMatchObject({ name: 'Дом', entries, copiedFrom: 'home-basic' })
  })

  it('updates the whole document and keeps its origin and creation time', () => {
    const createdAt = Timestamp.fromMillis(1000)
    const template: Template = {
      id: 't1',
      name: 'Старое',
      entries,
      copiedFrom: 'home-basic',
      createdAt,
      updatedAt: createdAt,
    }

    updateTemplate(uid, template, { name: 'Новое', entries: [...entries, ...entries] })

    const { path, data } = written()
    expect(path).toBe(`users/${uid}/templates/t1`)
    expect(data).not.toHaveProperty('id')
    expect(data).toMatchObject({ name: 'Новое', copiedFrom: 'home-basic', createdAt })
    expect(data.entries).toHaveLength(2)
    expect(data.updatedAt.toMillis()).toBeGreaterThan(1000)
  })

  it('deletes by id', () => {
    deleteTemplate(uid, 't1')

    expect((vi.mocked(deleteDoc).mock.calls[0]?.[0] as DocumentReference).path).toBe(
      `users/${uid}/templates/t1`,
    )
  })
})
