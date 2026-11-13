import { useState } from 'react'

import type { Equipment } from '@/entities/exercise'
import { Button } from '@/shared/ui'

import { AddToSetSheet } from '../add-to-set-sheet'

interface AddToSetProps {
  uid: string
  exerciseId: string
  homeEquipment: readonly Equipment[]
}

export function AddToSet({ uid, exerciseId, homeEquipment }: AddToSetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="cta" className="mt-2.5 min-h-14 text-[17px]" onClick={() => setOpen(true)}>
        Добавить в набор
      </Button>
      <AddToSetSheet
        uid={uid}
        exerciseId={exerciseId}
        homeEquipment={homeEquipment}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
