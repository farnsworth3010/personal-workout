import type { ListedTemplate, TemplateRef } from '@/entities/template'
import { Button, Title } from '@/shared/ui'

import { weekdayName } from '../../lib/format'

interface RestDayProps {
  now: Date
  // Nothing is planned on any weekday.
  planEmpty: boolean
  next: { date: Date; refs: readonly TemplateRef[] } | null
  find: (ref: TemplateRef) => ListedTemplate | undefined
  onPlan: () => void
  onOther: () => void
}

export function RestDay({ now, planEmpty, next, find, onPlan, onOther }: RestDayProps) {
  return (
    <section aria-labelledby="rest-title" className="flex flex-col gap-3.5">
      <div>
        <p className="mb-1.5 text-[13px] text-muted-foreground">
          По расписанию · {weekdayName(now)}
        </p>
        <Title as="h2" id="rest-title" className="min-[900px]:text-[34px]">
          {planEmpty ? 'План пуст' : 'День отдыха'}
        </Title>
      </div>
      <p className="text-[15px] leading-[1.45] text-muted-foreground">
        {planEmpty
          ? 'В плане на неделю нет ни одного набора. Добавьте наборы в дни недели — они будут повторяться каждую неделю.'
          : 'На сегодня тренировка не запланирована. Мышцы растут, пока вы отдыхаете.'}
      </p>
      {planEmpty && (
        <Button size="cta" onClick={onPlan}>
          Добавить наборы в план
        </Button>
      )}
      {next && (
        <p className="text-[15px] leading-[1.45]">
          Следующая по плану — {weekdayName(next.date)}:{' '}
          {next.refs.map((ref) => find(ref)?.name ?? 'Набор удалён').join(', ')}
        </p>
      )}
      <Button variant="outline" size="ghost" onClick={onOther}>
        Другая тренировка
      </Button>
    </section>
  )
}
