import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { muscleLabels, photoUrl, useCatalog, type Exercise } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import {
  createTemplate,
  deleteTemplate,
  estimateDurationMin,
  gymOnlyCount,
  muscleGroupsOf,
  needsGym,
  updateTemplate,
  useOwnTemplates,
  type Template,
} from '@/entities/template'
import { useExerciseStats } from '@/entities/workout'
import { PickExerciseSheet } from '@/features/pick-exercise'
import type { AuthUser, Equipment, ExerciseKind } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Badge, EmptyState, HoldButton, toast } from '@/shared/ui'

import {
  amountLabel,
  move,
  newRow,
  previewEntries,
  rowOf,
  validate,
  type Field,
  type Problem,
  type Row,
} from '../model/editor'

type ById = Record<string, Exercise | undefined>

const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid'
const icon = cn(
  'grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent',
  focusRing,
)
const input =
  'w-full rounded-lg border border-border bg-surface outline-none focus:border-primary aria-invalid:border-warn'

const kindNote = (kind: ExerciseKind, lastKg: number | undefined) =>
  ({
    strength: `Силовое · ${lastKg ? `в прошлый раз ${String(lastKg).replace('.', ',')} кг` : 'вес подставится после первой тренировки'}`,
    bodyweight: 'С весом тела · доп. вес по желанию',
    timed: 'На время',
    cardio: 'Кардио',
  })[kind]

// template-edit.html for /templates/new and /templates/:id; ?add=<exerciseId> comes from the catalog.
export function TemplateEditPage({ user }: { user: AuthUser }) {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { profile } = useProfile(user.uid)
  const { data: catalog } = useCatalog()
  const { data: own, error } = useOwnTemplates(user.uid)
  const byId = useMemo(
    () => Object.fromEntries((catalog ?? []).map((e) => [e.id, e])) as ById,
    [catalog],
  )
  const [addId] = useState(() => params.get('add'))

  // The appended exercise is part of the draft now; a reload must not add it again.
  useEffect(() => {
    if (addId) setParams({}, { replace: true })
  }, [addId, setParams])

  const back = (
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

  if (error) {
    return (
      <>
        {back}
        <Title>{id ? 'Редактор набора' : 'Новый набор'}</Title>
        <EmptyState title="Не удалось загрузить набор" description="Попробуйте открыть позже." />
      </>
    )
  }

  if (!catalog || !profile || (id && !own)) {
    return (
      <>
        {back}
        <Title>{id ? 'Редактор набора' : 'Новый набор'}</Title>
        <p className="text-[15px] text-muted-foreground">Загрузка…</p>
      </>
    )
  }

  const template = id ? own?.find((t) => t.id === id) : undefined

  if (id && !template) {
    return (
      <>
        {back}
        <Title>{id ? 'Редактор набора' : 'Новый набор'}</Title>
        <EmptyState
          title="Набор не найден"
          description="Возможно, его удалили на другом устройстве."
        />
      </>
    )
  }

  return (
    <>
      {back}
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

const Title = ({ children }: { children: string }) => (
  <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[32px]">
    {children}
  </h1>
)

interface EditorProps {
  uid: string
  template: Template | undefined
  addId: string | null
  byId: ById
  homeEquipment: Equipment[]
  defaultRestSec: number
}

function Editor({ uid, template, addId, byId, homeEquipment, defaultRestSec }: EditorProps) {
  const navigate = useNavigate()
  const list = useRef<HTMLOListElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<string | null>(null)

  const kindOf = (exerciseId: string) => byId[exerciseId]?.kind
  const nameOf = (exerciseId: string) => byId[exerciseId]?.name ?? exerciseId

  const [name, setName] = useState(template?.name ?? '')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [picking, setPicking] = useState(false)
  const [rows, setRows] = useState<Row[]>(() => {
    const initial = (template?.entries ?? []).map((e) => rowOf(e, byId[e.exerciseId]?.kind))
    const added = addId ? byId[addId] : undefined
    const fresh = added && !initial.some((r) => r.exerciseId === added.id)

    return fresh ? [...initial, newRow(added.id, added.kind, defaultRestSec)] : initial
  })

  useEffect(() => {
    const added = addId ? byId[addId] : undefined
    if (added) toast(`Добавлено: ${added.name}`)
    // Only on open: the draft took the exercise in its initial state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus moves after the re-render that placed the row, so the moved or next control exists.
  useEffect(() => {
    const selector = pendingFocus.current
    if (!selector) return

    pendingFocus.current = null
    const target = selector === 'add' ? addButton.current : list.current?.querySelector(selector)
    if (target instanceof HTMLElement) target.focus()
  }, [rows])

  const stats = useExerciseStats(
    uid,
    rows.map((r) => r.exerciseId),
  )
  const entries = previewEntries(rows, kindOf)
  const gymCount = gymOnlyCount({ entries }, byId, homeEquipment)
  const groups = muscleGroupsOf({ entries }, byId).map((m) =>
    muscleLabels[m].toLocaleLowerCase('ru'),
  )

  const edit = (index: number, field: Field, value: string) => {
    setProblem(null)
    setRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const reorder = (index: number, delta: number) => {
    const next = move(rows, index, delta)
    const target = index + delta
    const edge = target === 0 ? -1 : target === rows.length - 1 ? 1 : 0

    // At the edge the pressed direction is disabled, so focus takes the other button.
    const dir = edge === delta ? -delta : delta
    pendingFocus.current = `[data-row="${rows[index].key}"][data-move="${dir}"]`
    setRows([...next])
  }

  const remove = (index: number) => {
    const row = rows[index]
    const neighbour = rows.at(index + 1) ?? (index > 0 ? rows[index - 1] : undefined)
    pendingFocus.current = neighbour ? `[data-row="${neighbour.key}"][data-remove]` : 'add'
    setProblem(null)
    setRows(rows.filter((_, i) => i !== index))
    toast(`Убрано: ${nameOf(row.exerciseId)}`)
  }

  const add = (exerciseId: string) => {
    const exercise = byId[exerciseId]
    if (!exercise) return

    setProblem(null)
    setRows((current) => [...current, newRow(exerciseId, exercise.kind, defaultRestSec)])
    toast(`Добавлено: ${exercise.name}`)
  }

  const save = () => {
    const result = validate(name, rows, kindOf, nameOf)

    if (!result.ok) {
      // The save bar's alert line announces it; a toast would cover the bar on phones.
      setProblem(result)

      const { focus } = result
      if (focus === 'name') nameInput.current?.focus()
      else if (focus === 'add') addButton.current?.focus()
      else {
        const key = rows[focus.row].key
        list.current
          ?.querySelector<HTMLInputElement>(`[data-row="${key}"][data-field="${focus.field}"]`)
          ?.focus()
      }
      return
    }

    const draft = { name: result.name, entries: result.entries }
    if (template) updateTemplate(uid, template, draft)
    else createTemplate(uid, draft)

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
            ref={nameInput}
            value={name}
            autoComplete="off"
            placeholder="Вторник: спина"
            aria-invalid={problem?.focus === 'name' || undefined}
            onChange={(event) => {
              setProblem(null)
              setName(event.target.value)
            }}
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
          <ol ref={list} aria-label="Упражнения набора" className="border-t border-border">
            {rows.map((row, index) => {
              const exercise = byId[row.exerciseId]

              return (
                <Item
                  key={row.key}
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
                  onEdit={(field, value) => edit(index, field, value)}
                  onMove={(delta) => reorder(index, delta)}
                  onRemove={() => remove(index)}
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
          ref={addButton}
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
        onPick={add}
        homeEquipment={homeEquipment}
        disabledIds={rows.map((r) => r.exerciseId)}
      />
    </div>
  )
}

interface ItemProps {
  row: Row
  index: number
  last: boolean
  exercise: Exercise | undefined
  lastKg: number | undefined
  gym: boolean
  invalid: (field: Field) => boolean
  onEdit: (field: Field, value: string) => void
  onMove: (delta: number) => void
  onRemove: () => void
}

function Item({
  row,
  index,
  last,
  exercise,
  lastKg,
  gym,
  invalid,
  onEdit,
  onMove,
  onRemove,
}: ItemProps) {
  const name = exercise?.name ?? row.exerciseId
  const kind = exercise?.kind ?? 'strength'

  const field = (key: Field, label: string, decimal = false) => (
    <label className="block min-w-0">
      <small className="mb-1.5 block text-[13px] text-muted-foreground min-[900px]:mb-1 min-[900px]:text-xs">
        {label}
      </small>
      <input
        data-row={row.key}
        data-field={key}
        value={row[key]}
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-label={`${label}: ${name}`}
        aria-invalid={invalid(key) || undefined}
        onChange={(event) => onEdit(key, event.target.value)}
        className={cn(input, 'min-h-11 px-1.5 text-center text-[17px] font-semibold tabular-nums')}
      />
    </label>
  )

  const arrow = (delta: number, label: string, path: string, disabled: boolean) => (
    <button
      type="button"
      data-row={row.key}
      data-move={delta}
      disabled={disabled}
      aria-label={`${label}: ${name}`}
      onClick={() => onMove(delta)}
      className={cn(icon, 'border border-border')}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={path} />
      </svg>
    </button>
  )

  return (
    <li className="flex flex-col gap-2.5 border-b border-border py-3 min-[900px]:grid min-[900px]:grid-cols-[56px_minmax(0,1fr)_repeat(3,68px)_auto_44px] min-[900px]:items-center min-[900px]:gap-2.5 min-[900px]:py-2.5">
      <div className="grid grid-cols-[56px_minmax(0,1fr)_44px] items-center gap-3 min-[900px]:contents">
        <img
          src={exercise && photoUrl(exercise, 0)}
          alt=""
          className="size-14 rounded-lg bg-surface object-cover"
        />
        <div className="min-w-0">
          <b className="block text-base leading-tight font-semibold">
            <span className="text-muted-foreground tabular-nums">{index + 1}.</span> {name}
            {gym && <Badge className="ml-1.5 align-[1px]">зал</Badge>}
          </b>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {kindNote(kind, lastKg)}
          </span>
        </div>
        <button
          type="button"
          data-row={row.key}
          data-remove
          aria-label={`Убрать «${name}»`}
          onClick={onRemove}
          className={cn(icon, 'text-[26px] min-[900px]:order-1')}
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-2 min-[900px]:contents">
        {field('sets', 'Подходы')}
        {field('amount', amountLabel(kind), kind === 'cardio')}
        {field('rest', 'Отдых, с')}
        <div className="flex gap-1">
          {arrow(-1, 'Выше', 'm6 15 6-6 6 6', index === 0)}
          {arrow(1, 'Ниже', 'm6 9 6 6 6-6', last)}
        </div>
      </div>
    </li>
  )
}
