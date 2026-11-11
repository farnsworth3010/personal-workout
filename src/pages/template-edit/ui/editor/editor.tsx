import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { muscleLabels, type Exercise } from '@/entities/exercise'
import {
  createTemplate,
  deleteTemplate,
  estimateDurationMin,
  gymOnlyCount,
  muscleGroupsOf,
  needsGym,
  updateTemplate,
  type Template,
} from '@/entities/template'
import { useExerciseStats } from '@/entities/workout'
import { PickExerciseSheet } from '@/features/pick-exercise'
import type { Equipment } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Button, HoldButton, toast } from '@/shared/ui'
import { ExerciseDetails } from '@/widgets/exercise-details'

import { previewEntries, type Field } from '../../model/editor'
import { useTemplateDraft } from '../../model/use-template-draft'
import { EntryRow } from '../entry-row'
import { focusRing, input } from '../styles'
import { Title } from '../title'

interface EditorProps {
  uid: string
  template: Template | undefined
  addId: string | null
  byId: Readonly<Record<string, Exercise | undefined>>
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

  const stats = useExerciseStats(
    uid,
    rows.map((r) => r.exerciseId),
  )
  const entries = previewEntries(rows, draft.kindOf)
  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.exerciseId] = (counts[row.exerciseId] ?? 0) + 1
  const gymCount = gymOnlyCount({ entries }, byId, homeEquipment)
  const groups = muscleGroupsOf({ entries }, byId).map((m) =>
    muscleLabels[m].toLocaleLowerCase('ru'),
  )

  const save = () => {
    const result = draft.check()
    if (!result.ok) return

    const next = { name: result.name, entries: result.entries }
    if (template) updateTemplate(uid, template, next)
    else createTemplate(uid, next)

    toast('Набор сохранён')
    void navigate('/templates')
  }

  const invalid = (index: number, field: Field) =>
    typeof problem?.focus === 'object' &&
    problem.focus.row === index &&
    problem.focus.field === field

  return (
    <div className="flex min-w-0 flex-col gap-4 min-[900px]:grid min-[900px]:grid-cols-[260px_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-10">
      <div className="flex min-w-0 flex-col gap-3.5 min-[900px]:sticky min-[900px]:top-6 min-[900px]:gap-[18px]">
        <Title>{template ? 'Редактор набора' : 'Новый набор'}</Title>

        <label className="block">
          <small className="mb-1.5 block text-[13px] text-muted-foreground">Название</small>
          <input
            ref={nameInputRef}
            value={draft.name}
            autoComplete="off"
            placeholder="Вторник: спина"
            aria-invalid={problem?.focus === 'name' || undefined}
            onChange={(event) => draft.setName(event.target.value)}
            className={cn(input, 'min-h-13 px-3.5 text-lg font-semibold')}
          />
        </label>

        <dl className="grid grid-cols-2 border-y border-border">
          <div className="py-2.5">
            <dt className="mb-0.5 text-xs text-muted-foreground">Упражнений</dt>
            <dd className="text-2xl font-bold tabular-nums">{rows.length}</dd>
          </div>
          <div className="py-2.5">
            <dt className="mb-0.5 text-xs text-muted-foreground">Примерно</dt>
            <dd className="text-2xl font-bold tabular-nums">
              ~{estimateDurationMin({ entries }, byId)} мин
            </dd>
          </div>
        </dl>

        <p className="text-sm text-muted-foreground">
          {groups.length > 0
            ? `Мышцы: ${groups.join(', ')}`
            : 'Мышцы появятся, когда добавите упражнения'}
        </p>

        {gymCount > 0 && (
          <p className="flex items-baseline gap-2 text-[15px] font-semibold text-warn">
            <span
              aria-hidden
              className="size-5 shrink-0 translate-y-[3px] rounded-full bg-warn text-center text-[13px] leading-5 font-extrabold text-on-accent"
            >
              !
            </span>
            <span>
              В наборе есть упражнения для зала: <span className="tabular-nums">{gymCount}</span>
              <span className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
                Для них нужно оборудование, которого нет в вашем профиле
              </span>
            </span>
          </p>
        )}

        <div
          data-save-bar
          className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-[4] grid grid-cols-[1fr_2fr] gap-2 border-t border-border bg-background px-4 py-3 min-[900px]:static min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:p-0"
        >
          {/* The save bar's alert line announces a problem; a toast would cover the bar on phones. */}
          {problem && (
            <p role="alert" className="col-span-full text-sm font-semibold text-warn">
              {problem.message}
            </p>
          )}
          <Link
            to="/templates"
            className={cn(
              'flex min-h-12 items-center justify-center rounded-lg border border-border text-base font-bold',
              focusRing,
            )}
          >
            Отмена
          </Link>
          <button
            type="button"
            onClick={save}
            className={cn(
              'min-h-12 rounded-lg bg-primary text-base font-bold text-on-accent uppercase',
              focusRing,
            )}
          >
            Сохранить
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3.5">
        {rows.length > 0 ? (
          <ol ref={listRef} aria-label="Упражнения набора" className="border-t border-border">
            {rows.map((row, index) => {
              const exercise = byId[row.exerciseId]

              return (
                <EntryRow
                  key={row.id}
                  row={row}
                  index={index}
                  last={index === rows.length - 1}
                  exercise={exercise}
                  lastKg={stats?.[row.exerciseId]?.lastSets.reduce(
                    (max, set) => Math.max(max, set.weightKg ?? 0),
                    0,
                  )}
                  gym={exercise !== undefined && needsGym(exercise, homeEquipment)}
                  invalid={(field) => invalid(index, field)}
                  onEdit={(field, value) => draft.edit(row.id, field, value)}
                  onMove={(delta) => draft.reorder(row.id, delta)}
                  onRemove={() => draft.remove(row.id)}
                />
              )
            })}
          </ol>
        ) : (
          <p className="border-y border-border py-6 text-[15px] leading-[1.4] text-muted-foreground">
            В наборе пока нет упражнений. Добавьте их из каталога: порядок, подходы и отдых
            настраиваются здесь.
          </p>
        )}

        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setPicking(true)}
          className={cn(
            'min-h-13 rounded-lg border border-dashed border-muted-foreground text-base font-semibold hover:border-primary hover:text-primary',
            focusRing,
          )}
        >
          + Добавить упражнение
        </button>
        {template && (
          <HoldButton
            label="Удалить набор"
            onConfirm={() => {
              deleteTemplate(uid, template.id)
              toast(`Набор «${template.name}» удалён`)
              void navigate('/templates')
            }}
            className={cn(
              'min-h-11 self-start rounded-lg px-1 text-[15px] text-muted-foreground hover:text-foreground',
              focusRing,
            )}
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
        counts={counts}
      />
      {details && (
        <ExerciseDetails
          exerciseId={details.id}
          homeEquipment={homeEquipment}
          open={details.open}
          onOpenChange={(open) => setDetails({ ...details, open })}
        >
          <Button
            className="mt-2.5 min-h-14 rounded-lg text-[17px] font-bold uppercase"
            onClick={() => {
              draft.add(details.id)
              setDetails({ ...details, open: false })
            }}
          >
            Добавить в набор
          </Button>
        </ExerciseDetails>
      )}
    </div>
  )
}
