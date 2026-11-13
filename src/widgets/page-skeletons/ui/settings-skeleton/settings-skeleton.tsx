import { Loading, PageHeader, Section, Skeleton } from '@/shared/ui'

// Whole-page fallback for the /settings route while its module loads (3.2); mirrors `SettingsPage`.
export function SettingsSkeleton() {
  return (
    <Loading>
      <PageHeader title="Профиль" />

      <div className="min-w-0 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-x-12">
        <div className="min-w-0">
          <Section id="h-account-skeleton" title="Аккаунт">
            <div className="grid grid-cols-[56px_1fr_auto] items-center gap-3.5">
              <Skeleton className="size-14 rounded-full" />
              <div className="min-w-0">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1.5 h-4 w-40" />
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-4 flex min-w-0 flex-col gap-4 min-[900px]:col-start-2 min-[900px]:row-span-3 min-[900px]:row-start-1 min-[900px]:mt-0">
          <Section id="h-defaults-skeleton" title="По умолчанию">
            <Skeleton className="min-h-13 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
          </Section>
          <Section id="h-feedback-skeleton" title="Звуки и анимации">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </Section>
          <Section id="h-timers-skeleton" title="Таймеры">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </Section>
        </div>

        <Section
          id="h-gear-skeleton"
          title="Моё оборудование дома"
          className="mt-5 min-[900px]:col-start-2"
        >
          <Skeleton className="h-32 rounded-lg" />
        </Section>
      </div>
    </Loading>
  )
}
