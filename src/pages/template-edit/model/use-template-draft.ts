import { useEffect, useRef, useState } from 'react'

import type { Exercise } from '@/entities/exercise'
import type { Template } from '@/entities/template'
import { toast } from '@/shared/ui'

import {
  initialRows,
  move,
  newRow,
  validate,
  type Field,
  type Problem,
  type Row,
  type Validation,
} from './editor'

interface DraftOptions {
  template: Template | undefined
  addId: string | null
  byId: Readonly<Record<string, Exercise | undefined>>
  defaultRestSec: number
}

/** The editor's draft: name, rows by key, the current problem and where focus goes next. */
export function useTemplateDraft({ template, addId, byId, defaultRestSec }: DraftOptions) {
  const list = useRef<HTMLOListElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<string | null>(null)

  const kindOf = (exerciseId: string) => byId[exerciseId]?.kind
  const nameOf = (exerciseId: string) => byId[exerciseId]?.name ?? exerciseId

  const [initial] = useState(() =>
    initialRows(template?.entries ?? [], addId, byId, defaultRestSec),
  )
  const [name, setNameValue] = useState(template?.name ?? '')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [rows, setRows] = useState<Row[]>(initial.rows)

  const addedName = initial.added?.name
  useEffect(() => {
    if (addedName) toast(`Добавлено: ${addedName}`)
  }, [addedName])

  // Focus moves after the re-render that placed the row, so the moved or next control exists.
  useEffect(() => {
    const selector = pendingFocus.current
    if (!selector) return

    pendingFocus.current = null
    const target = selector === 'add' ? addButton.current : list.current?.querySelector(selector)
    if (target instanceof HTMLElement) target.focus()
  }, [rows])

  const setName = (value: string) => {
    setProblem(null)
    setNameValue(value)
  }

  const edit = (key: string, field: Field, value: string) => {
    setProblem(null)
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const reorder = (key: string, delta: number) => {
    const index = rows.findIndex((row) => row.key === key)
    const target = index + delta
    const edge = target === 0 ? -1 : target === rows.length - 1 ? 1 : 0

    // At the edge the pressed direction is disabled, so focus takes the other button.
    const dir = edge === delta ? -delta : delta
    pendingFocus.current = `[data-row="${key}"][data-move="${dir}"]`
    setRows((current) =>
      move(
        current,
        current.findIndex((row) => row.key === key),
        delta,
      ),
    )
  }

  const remove = (key: string) => {
    const index = rows.findIndex((row) => row.key === key)
    const row = rows.at(index)
    const neighbour = rows.at(index + 1) ?? (index > 0 ? rows.at(index - 1) : undefined)

    pendingFocus.current = neighbour ? `[data-row="${neighbour.key}"][data-remove]` : 'add'
    setProblem(null)
    setRows((current) => current.filter((r) => r.key !== key))
    if (row) toast(`Убрано: ${nameOf(row.exerciseId)}`)
  }

  const add = (exerciseId: string) => {
    const exercise = byId[exerciseId]
    if (!exercise) return

    setProblem(null)
    setRows((current) => [...current, newRow(exerciseId, exercise.kind, defaultRestSec)])
    toast(`Добавлено: ${exercise.name}`)
  }

  /** Validates the draft; on a problem shows it and focuses the field to fix. */
  const check = (): Validation => {
    const result = validate(name, rows, kindOf, nameOf)
    if (result.ok) return result

    setProblem(result)

    const { focus } = result
    if (focus === 'name') nameInput.current?.focus()
    else if (focus === 'add') addButton.current?.focus()
    else {
      const key = rows.at(focus.row)?.key
      list.current
        ?.querySelector<HTMLInputElement>(`[data-row="${key ?? ''}"][data-field="${focus.field}"]`)
        ?.focus()
    }

    return result
  }

  return {
    listRef: list,
    nameInputRef: nameInput,
    addButtonRef: addButton,
    name,
    setName,
    problem,
    rows,
    kindOf,
    edit,
    reorder,
    remove,
    add,
    check,
  }
}
