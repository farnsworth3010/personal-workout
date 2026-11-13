import { useMemo } from 'react'

import type { Equipment, TemplateRef } from '@/shared/api'

import { useOwnTemplates } from '../api/own-templates'
import { useReadyTemplates } from '../api/ready-templates'
import type { ExerciseFactsById } from '../lib/derive'
import { listTemplates, refKey } from '../lib/template-list'

/**
 * Own and ready-made sets as list rows behind one lookup by ref, own ones first. Takes the catalog
 * by id from the caller (an entity cannot read another); undefined while the catalog loads.
 */
export function useTemplateList(
  uid: string,
  byId: ExerciseFactsById | undefined,
  homeEquipment: readonly Equipment[],
) {
  const { data: ownTemplates, error: ownError } = useOwnTemplates(uid)
  const { data: readyTemplates, error: readyError } = useReadyTemplates()

  const lists = useMemo(() => {
    const facts = byId ?? {}
    const own = listTemplates('own', ownTemplates, facts, homeEquipment)
    const ready = listTemplates('ready', readyTemplates, facts, homeEquipment)
    const all = [...(own ?? []), ...(ready ?? [])]
    const byRef = new Map(all.map((set) => [refKey(set.ref), set]))

    return {
      own,
      ready,
      all,
      // The documents themselves, for their declared place and home/gym pair.
      readyTemplates: readyTemplates ?? [],
      loaded: byId !== undefined && ownTemplates !== undefined && readyTemplates !== undefined,
      find: (ref: TemplateRef) => byRef.get(refKey(ref)),
    }
  }, [byId, ownTemplates, readyTemplates, homeEquipment])

  return { ...lists, ownError, readyError }
}
