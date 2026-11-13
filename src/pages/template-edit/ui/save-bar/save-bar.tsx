import { Link } from 'react-router'

import type { Problem } from '../../model/types'

interface SaveBarProps {
  problem: Problem | null
  onSave: () => void
}

export function SaveBar({ problem, onSave }: SaveBarProps) {
  return (
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
        className="flex min-h-12 items-center justify-center rounded-lg border border-border text-base font-bold focus-ring"
      >
        Отмена
      </Link>
      <button
        type="button"
        onClick={onSave}
        className="min-h-12 rounded-lg bg-primary text-base font-bold text-on-accent uppercase focus-ring"
      >
        Сохранить
      </button>
    </div>
  )
}
