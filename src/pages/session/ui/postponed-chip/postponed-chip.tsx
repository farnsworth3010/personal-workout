export function PostponedChip({ count, onOpen }: { count: number; onOpen: () => void }) {
  if (count === 0) return null

  // A 44px tap target around a compact pill; the negative margins tuck it under the progress bar.
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className="-mt-2.5 -mb-1.5 flex min-h-11 items-center self-end text-[13px]"
      onClick={onOpen}
    >
      <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
        <span className="size-2 rounded-full bg-warn" />
        Отложено: <b className="tabular-nums">{count}</b>
      </span>
    </button>
  )
}
