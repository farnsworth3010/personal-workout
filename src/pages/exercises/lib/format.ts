import { equipmentLabels, muscleGroups, type Equipment } from '@/entities/exercise'
import { capitalize, plural } from '@/shared/lib'

import type { CatalogParams } from '../model/params'

export const exercisesWord = (n: number) =>
  `${n} ${plural(n, ['упражнение', 'упражнения', 'упражнений'])}`

export const homeHint = (home: readonly Equipment[]) => {
  const items = home
    .filter((e) => e !== 'body only')
    .map((e) => equipmentLabels[e].toLocaleLowerCase('ru'))

  return `${capitalize(new Intl.ListFormat('ru').format([...items, 'свой вес']))} — из профиля`
}

/** What the empty result was searched for, e.g. «по запросу «жим», для дома». */
export const emptyText = ({ q, group, equipment, homeOnly }: CatalogParams) =>
  [
    q && `по запросу «${q}»`,
    group && `в группе «${muscleGroups[group].label}»`,
    equipment && `с оборудованием «${equipmentLabels[equipment]}»`,
    homeOnly && 'для дома',
  ]
    .filter(Boolean)
    .join(', ')
