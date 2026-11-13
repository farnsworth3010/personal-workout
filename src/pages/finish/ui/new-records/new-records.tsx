import { Heading } from '@/shared/ui'

import { recordLabels } from '../../config/record-labels'
import { recordValue } from '../../lib/format'
import type { NewRecord } from '../../model/types'

export function NewRecords({ records }: { records: readonly NewRecord[] }) {
  if (records.length === 0) return null

  return (
    <section aria-labelledby="h-records" className="flex flex-col gap-2">
      <Heading id="h-records">Новые рекорды</Heading>
      {records.map(({ id, key, name, now, was }) => (
        <p
          key={`${id}-${key}`}
          className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 rounded-lg border border-primary px-3.5 py-3"
        >
          <span className="row-span-2 rounded-full bg-primary px-2 py-1 text-[11px] font-extrabold text-on-accent uppercase">
            Рекорд
          </span>
          <b className="text-[15px]">{name}</b>
          <span className="text-[13px] text-muted-foreground">
            {recordLabels[key]}:{' '}
            <strong className="font-semibold text-foreground tabular-nums">
              {recordValue(key, now)}
            </strong>
            {was !== undefined && ` · было ${was}`}
          </span>
        </p>
      ))}
    </section>
  )
}
