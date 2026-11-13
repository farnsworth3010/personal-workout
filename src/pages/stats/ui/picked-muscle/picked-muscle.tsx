import { muscleLabels } from '@/entities/exercise'
import type { Muscle } from '@/shared/api'
import { n1, plural } from '@/shared/lib'

import { loadLevel, loadLevelLabels } from '../../model/muscle-load'

export function PickedMuscle({ muscle, sets }: { muscle: Muscle | null; sets: number }) {
  return (
    <div
      aria-live="polite"
      className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-y border-border py-2.5"
    >
      {muscle === null ? (
        <b className="text-[15px] font-normal text-muted-foreground">
          Нажмите на мышцу, чтобы увидеть подходы
        </b>
      ) : (
        <>
          <b className="text-lg font-bold">{muscleLabels[muscle]}</b>
          <span className="row-span-2 text-right text-[26px] font-bold tabular-nums">
            {n1(sets)}
            <small className="block text-xs font-normal text-muted-foreground">
              {plural(sets, ['подход', 'подхода', 'подходов'])} за неделю
            </small>
          </span>
          <small className="col-start-1 text-[13px] text-muted-foreground">
            {loadLevelLabels[loadLevel(sets)]}
          </small>
        </>
      )}
    </div>
  )
}
