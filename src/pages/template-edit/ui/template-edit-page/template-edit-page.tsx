import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { useCatalogById } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import { useOwnTemplates } from '@/entities/template'
import type { AuthUser } from '@/shared/api'
import { cn } from '@/shared/lib'
import { EmptyState } from '@/shared/ui'

import { Editor } from '../editor'
import { focusRing } from '../styles'
import { Title } from '../title'

// The back link and the title around every state before the editor opens.
function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <BackLink />
      <Title>{title}</Title>
      {children}
    </>
  )
}

const BackLink = () => (
  <Link
    to="/templates"
    className={cn(
      'inline-flex min-h-11 items-center self-start text-[15px] text-muted-foreground',
      focusRing,
    )}
  >
    ← Наборы
  </Link>
)

// template-edit.html for /templates/new and /templates/:id; ?add=<exerciseId> comes from the catalog.
export function TemplateEditPage({ user }: { user: AuthUser }) {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { profile } = useProfile(user.uid)
  const { data: byId } = useCatalogById()
  const { data: own, error } = useOwnTemplates(user.uid)
  const [addId] = useState(() => params.get('add'))
  const title = id ? 'Редактор набора' : 'Новый набор'

  // The appended exercise is part of the draft now; a reload must not add it again.
  useEffect(() => {
    if (addId) setParams({}, { replace: true })
  }, [addId, setParams])

  if (error) {
    return (
      <Shell title={title}>
        <EmptyState title="Не удалось загрузить набор" description="Попробуйте открыть позже." />
      </Shell>
    )
  }

  if (!byId || !profile || (id && !own)) {
    return (
      <Shell title={title}>
        <p className="text-[15px] text-muted-foreground">Загрузка…</p>
      </Shell>
    )
  }

  const template = id ? own?.find((t) => t.id === id) : undefined

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
