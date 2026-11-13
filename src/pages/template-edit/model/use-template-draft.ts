import { useRef, useState } from 'react'

import type { ExercisesById } from '@/entities/exercise'
import type { Template } from '@/entities/template'
import { move } from '@/shared/lib'
import { toast } from '@/shared/ui'

import { initialRows, newRow } from './rows'
import type { Field, Problem, Row, Validation } from './types'
import { useFocusAfterRender } from './use-focus-after-render'
import { validate } from './validate'

interface DraftOptions {
  template: Template | undefined
  addId: string | null
  byId: ExercisesById
  defaultRestSec: number
}

/** The editor's draft: name, rows by key, the current problem and where focus goes next. */
export function useTemplateDraft({ template, addId, byId, defaultRestSec }: DraftOptions) {
  const nameInput = useRef<HTMLInputElement>(null)

  const kindOf = (exerciseId: string) => byId[exerciseId]?.kind
  const nameOf = (exerciseId: string) => byId[exerciseId]?.name ?? exerciseId

  const [name, setNameValue] = useState(template?.name ?? '')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [rows, setRows] = useState<Row[]>(() =>
    initialRows(template?.entries ?? [], addId, byId, defaultRestSec),
  )

  const { listRef, addButtonRef, focusAfterRender } = useFocusAfterRender(rows)

  const setName = (value: string) => {
    setProblem(null)
    setNameValue(value)
  }

  const edit = (key: string, field: Field, value: string) => {
    setProblem(null)
    setRows((current) => current.map((row) => (row.id === key ? { ...row, [field]: value } : row)))
  }

  const reorder = (key: string, delta: number) => {
    const index = rows.findIndex((row) => row.id === key)
    const target = index + delta
    const edge = target === 0 ? -1 : target === rows.length - 1 ? 1 : 0

    // At the edge the pressed direction is disabled, so focus takes the other button.
    const dir = edge === delta ? -delta : delta
    focusAfterRender(`[data-row="${key}"][data-move="${dir}"]`)
    setRows((current) =>
      move(
        current,
        current.findIndex((row) => row.id === key),
        delta,
      ),
    )
  }

  const remove = (key: string) => {
    const index = rows.findIndex((row) => row.id === key)
    const row = rows.at(index)
    const neighbour = rows.at(index + 1) ?? (index > 0 ? rows.at(index - 1) : undefined)

    focusAfterRender(neighbour ? `[data-row="${neighbour.id}"][data-remove]` : 'add')
    setProblem(null)
    setRows((current) => current.filter((r) => r.id !== key))
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
    else if (focus === 'add') addButtonRef.current?.focus()
    else {
      const key = rows.at(focus.row)?.id
      listRef.current
        ?.querySelector<HTMLInputElement>(`[data-row="${key ?? ''}"][data-field="${focus.field}"]`)
        ?.focus()
    }

    return result
  }

  return {
    listRef,
    nameInputRef: nameInput,
    addButtonRef,
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
