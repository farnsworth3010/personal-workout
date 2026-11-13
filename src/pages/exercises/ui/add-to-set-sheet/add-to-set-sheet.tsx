import { useNavigate } from 'react-router'

import { useCatalogById, type Equipment } from '@/entities/exercise'
import { estimateDurationMin, placeLabels, useTemplateList } from '@/entities/template'
import { Button, Loading, Sheet, SheetContent, Skeleton } from '@/shared/ui'

import { addToSetUrl } from '../../lib/add-url'

interface AddToSetSheetProps {
  uid: string
  exerciseId: string
  homeEquipment: readonly Equipment[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The person's own sets and «Новый набор»; the editor appends the exercise from ?add.
export function AddToSetSheet({
  uid,
  exerciseId,
  homeEquipment,
  open,
  onOpenChange,
}: AddToSetSheetProps) {
  const navigate = useNavigate()
  const { data: byId } = useCatalogById()
  const { own } = useTemplateList(uid, byId, homeEquipment)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Добавить в набор">
        {own === undefined ? (
          <Loading className="flex flex-col gap-1.5">
            <Skeleton className="min-h-14 rounded-lg" />
            <Skeleton className="min-h-14 rounded-lg" />
          </Loading>
        ) : (
          own.length > 0 && (
            <section aria-label="Мои наборы" className="flex flex-col gap-1.5">
              <p className="mt-1.5 text-[13px] text-muted-foreground">Мои наборы</p>
              {own.map((set) => (
                <button
                  key={set.ref.id}
                  type="button"
                  onClick={() => void navigate(addToSetUrl(set.ref.id, exerciseId))}
                  className="flex min-h-14 w-full flex-col justify-center rounded-lg border border-border bg-background px-3 py-2 text-left focus-ring"
                >
                  <b className="block text-[15px] font-semibold">{set.name}</b>
                  <small className="mt-0.5 block text-[13px] text-muted-foreground tabular-nums">
                    {placeLabels[set.place]} · {set.entries.length} упр. · ~
                    {estimateDurationMin(set, byId ?? {})} мин
                  </small>
                </button>
              ))}
            </section>
          )
        )}
        <Button
          variant="outline"
          size="ghost"
          onClick={() => void navigate(addToSetUrl(null, exerciseId))}
        >
          + Новый набор
        </Button>
      </SheetContent>
    </Sheet>
  )
}
