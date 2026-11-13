import { ValueStrip } from '@/shared/ui'

export function LabelledStrip(props: React.ComponentProps<typeof ValueStrip>) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] text-muted-foreground">{props.label}</p>
      <ValueStrip {...props} />
    </div>
  )
}
