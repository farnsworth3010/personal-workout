import { useParams } from 'react-router'

import { useCatalogById } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import { useOwnTemplates } from '@/entities/template'
import type { AuthUser } from '@/shared/api'
import { EmptyState } from '@/shared/ui'
import { TemplateEditSkeleton } from '@/widgets/page-skeletons'

import { useAddedToast, useAddParam } from '../../model/use-add-param'
import { BackLink } from '../back-link'
import { Editor } from '../editor'
import { Shell } from '../shell'

// template-edit.html for /templates/new and /templates/:id; ?add=<exerciseId> comes from the catalog.
export function TemplateEditPage({ user }: { user: AuthUser }) {
  const { id } = useParams()
  const { profile } = useProfile(user.uid)
  const { data: byId } = useCatalogById()
  const { data: own, error } = useOwnTemplates(user.uid)
  const addId = useAddParam()
  const title = id ? 'Редактор набора' : 'Новый набор'
  const template = id ? own?.find((t) => t.id === id) : undefined
  const editing = !error && byId && profile && (id ? template : true)

  useAddedToast(editing && addId ? byId[addId]?.name : undefined)

  if (error) {
    return (
      <Shell title={title}>
        <EmptyState title="Не удалось загрузить набор" description="Попробуйте открыть позже." />
      </Shell>
    )
  }

  if (!byId || !profile || (id && !own)) {
    return <TemplateEditSkeleton header={<BackLink />} />
  }

  if (id && !template) {
    return (
      <Shell title={title}>
        <EmptyState
          title="Набор не найден"
          description="Возможно, его удалили на другом устройстве."
        />
      </Shell>
    )
  }

  return (
    <>
      <BackLink />
      <Editor
        key={id ?? 'new'}
        uid={user.uid}
        template={template}
        addId={addId}
        byId={byId}
        homeEquipment={profile.homeEquipment}
        defaultRestSec={profile.defaultRestSec}
      />
    </>
  )
}
