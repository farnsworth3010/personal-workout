import { IconButton } from '../icon-button'

interface MoveButtonProps {
  rowId: string
  delta: number
  label: string
  exerciseName: string
  path: string
  disabled: boolean
  onMove: (delta: number) => void
}

export function MoveButton({
  rowId,
  delta,
  label,
  exerciseName,
  path,
  disabled,
  onMove,
}: MoveButtonProps) {
  return (
    <IconButton
      data-row={rowId}
      data-move={delta}
      disabled={disabled}
      aria-label={`${label}: ${exerciseName}`}
      onClick={() => onMove(delta)}
      className="border border-border"
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
    </IconButton>
  )
}
