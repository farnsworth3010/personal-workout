interface AnswerProps {
  title: string
  note?: string | null | 0
  children: React.ReactNode
}

export function Answer({ title, note, children }: AnswerProps) {
  return (
    <div className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-3 border-t border-border py-2 last:border-b">
      <h3 className="text-[15px] font-semibold">
        {title}
        {note ? (
          <small className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
            {note}
          </small>
        ) : null}
      </h3>
      {children}
    </div>
  )
}
