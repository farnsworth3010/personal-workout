import { useCatalogById } from '@/entities/exercise'
import { estimateDurationMin, type ListedTemplate } from '@/entities/template'
import { Button, HoldButton, Stat, StatRow } from '@/shared/ui'
import { SetExercises } from '@/widgets/set-exercises'

import { setCount } from '../../lib/format'

interface SetBodyProps {
  set: ListedTemplate
  onStart: () => void
  onOther: () => void
}

export function SetBody({ set, onStart, onOther }: SetBodyProps) {
  const { data: byId = {} } = useCatalogById()

  return (
    <div className="flex flex-col gap-3.5 pt-1 pb-5">
      <StatRow>
        <Stat label="Упражнений" value={set.entries.length} />
        <Stat label="Подходов" value={setCount(set.entries)} />
        <Stat label="Время" value={`~${estimateDurationMin(set, byId)}`} unit="мин" />
      </StatRow>
      <div className="grid gap-2 min-[900px]:grid-cols-[1fr_auto]">
        <HoldButton variant="cta" label="Начать тренировку" onConfirm={onStart} />
        <Button variant="outline" size="ghost" onClick={onOther}>
          Другая тренировка
        </Button>
      </div>
      <SetExercises name={set.name} entries={set.entries} />
    </div>
  )
}
