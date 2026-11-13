import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { ExercisesById } from '@/entities/exercise'
import { createTemplate, deleteTemplate, updateTemplate, type Template } from '@/entities/template'
import { PickExerciseSheet } from '@/features/pick-exercise'
import type { Equipment } from '@/shared/api'
import { HoldButton, toast } from '@/shared/ui'

import { exerciseCounts } from '../../lib/summary'
import { useTemplateDraft } from '../../model/use-template-draft'
import { DetailsSheet } from '../details-sheet'
import { EditorSummary } from '../editor-summary'
import { EntryList } from '../entry-list'
import { SaveBar } from '../save-bar'

interface EditorProps {
  uid: string
  template: Template | undefined
  addId: string | null
  byId: ExercisesById
  homeEquipment: Equipment[]
  defaultRestSec: number
}

// template-edit.html: name and summary with the save bar, then the rows and «Добавить упражнение».
export function Editor({ uid, template, addId, byId, homeEquipment, defaultRestSec }: EditorProps) {
  const navigate = useNavigate()
  const draft = useTemplateDraft({ template, addId, byId, defaultRestSec })
  const { rows, problem, listRef, nameInputRef, addButtonRef } = draft
  const [picking, setPicking] = useState(false)
  // The id stays while the description closes, so its content does not vanish mid-animation.
  const [details, setDetails] = useState<{ id: string; open: boolean } | null>(null)

  const save = () => {
    const result = draft.check()
    if (!result.ok) return

    const next = { name: result.name, entries: result.entries }
    if (template) updateTemplate(uid, template, next)
    else createTemplate(uid, next)

    toast('Набор сохранён')
    void navigate('/templates')
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 min-[900px]:grid min-[900px]:grid-cols-[260px_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-10">
      <div className="flex min-w-0 flex-col gap-3.5 min-[900px]:sticky min-[900px]:top-6 min-[900px]:gap-[18px]">
        <EditorSummary
          title={template ? 'Редактор набора' : 'Новый набор'}
          name={draft.name}
          nameInputRef={nameInputRef}
          nameInvalid={problem?.focus === 'name'}
          onNameChange={draft.setName}
          rows={rows}
          kindOf={draft.kindOf}
          homeEquipment={homeEquipment}
        />
        <SaveBar problem={problem} onSave={save} />
      </div>

      <div className="flex min-w-0 flex-col gap-3.5">
        <EntryList
          uid={uid}
          rows={rows}
          problem={problem}
          listRef={listRef}
          addButtonRef={addButtonRef}
          homeEquipment={homeEquipment}
          onEdit={draft.edit}
          onMove={draft.reorder}
          onRemove={draft.remove}
          onAdd={() => setPicking(true)}
        />
        {template && (
          <HoldButton
            label="Удалить набор"
            onConfirm={() => {
              deleteTemplate(uid, template.id)
              toast(`Набор «${template.name}» удалён`)
              void navigate('/templates')
            }}
            className="min-h-11 self-start rounded-lg px-1 text-[15px] text-muted-foreground focus-ring hover:text-foreground"
          />
        )}
      </div>

      {/* Room for the fixed save bar above the navigation on phones. */}
      <div aria-hidden className="h-[72px] min-[900px]:hidden" />

      <PickExerciseSheet
        open={picking}
        onOpenChange={setPicking}
        onPick={draft.add}
        onDetails={(id) => setDetails({ id, open: true })}
        homeEquipment={homeEquipment}
        counts={exerciseCounts(rows)}
      />
      {details && (
        <DetailsSheet
          exerciseId={details.id}
          open={details.open}
          homeEquipment={homeEquipment}
          onOpenChange={(open) => setDetails({ ...details, open })}
          onAdd={() => {
            draft.add(details.id)
            setDetails({ ...details, open: false })
          }}
        />
      )}
    </div>
  )
}
