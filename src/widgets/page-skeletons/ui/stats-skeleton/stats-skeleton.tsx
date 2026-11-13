import { Loading, PageHeader, Section, Skeleton } from '@/shared/ui'

interface StatsSkeletonProps {
  // Lets stats-page.tsx skip this component's own header: the page already renders PageHeader.
  withHeader?: boolean
}

export function StatsSkeleton({ withHeader = true }: StatsSkeletonProps) {
  return (
    <Loading>
      {withHeader && (
        <PageHeader title="Статистика" subtitle={<Skeleton className="inline-block h-4 w-32" />} />
      )}

      <div className="min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-x-12 min-[900px]:[grid-template-areas:'muscles_regular'_'muscles_progress'_'body_body']">
        <Section
          id="h-muscles"
          title="Нагрузка на мышцы за неделю"
          className="min-[900px]:[grid-area:muscles]"
        >
          <div className="grid min-w-0 grid-cols-2 gap-2 min-[900px]:gap-4">
            <Skeleton className="aspect-[200/440] w-full" />
            <Skeleton className="aspect-[200/440] w-full" />
          </div>
        </Section>

        <Section id="h-regular" title="Регулярность" className="min-[900px]:[grid-area:regular]">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-3 border-t border-border">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="min-w-0 py-3">
                <Skeleton className="mb-0.5 h-3 w-16" />
                <Skeleton className="h-[26px] w-10" />
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="h-progress"
          title="Прогресс по упражнению"
          className="min-[900px]:[grid-area:progress]"
        >
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[190px] w-full min-[900px]:h-[220px]" />
        </Section>

        <Section id="h-body" title="Тело и самочувствие" className="min-[900px]:[grid-area:body]">
          <div className="flex flex-col gap-6 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-x-12">
            <Skeleton className="h-[190px] w-full min-[900px]:h-[220px]" />
            <Skeleton className="h-[190px] w-full min-[900px]:h-[220px]" />
          </div>
        </Section>
      </div>
    </Loading>
  )
}
