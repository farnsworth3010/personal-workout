import { CatalogFilters } from '@/entities/exercise'
import type { AuthUser } from '@/shared/api'
import { Button, EmptyState, Loading, PageHeader, ScrollTop, Skeleton } from '@/shared/ui'
import { ExerciseDetails } from '@/widgets/exercise-details'
import { CatalogListSkeleton } from '@/widgets/page-skeletons'

import { exercisesWord, homeHint } from '../../lib/format'
import { useCatalogView } from '../../model/use-catalog-view'
import { AddToSet } from '../add-to-set'
import { CatalogList } from '../catalog-list'
import { CatalogSearch } from '../catalog-search'
import { DetailsPanel } from '../details-panel'

// exercises.html: search and filters live in the URL; details open in a sheet or a side panel.
export function ExercisesPage({ user }: { user: AuthUser }) {
  const view = useCatalogView(user.uid)
  const { catalog, homeEquipment, desktop, visible, selected } = view

  return (
    <>
      <PageHeader
        title="Упражнения"
        subtitle={
          catalog.data ? (
            `Каталог · ${exercisesWord(view.total)}`
          ) : (
            <Skeleton className="inline-block h-4 w-40" />
          )
        }
        className="tabular-nums"
      />

      <div className="min-w-0 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-[900px]:items-start min-[900px]:gap-10">
        <section aria-label="Каталог" className="flex min-w-0 flex-col gap-3.5">
          <CatalogSearch value={view.query} onChange={view.search} />

          <CatalogFilters
            value={view.params}
            onChange={view.update}
            allMuscles="Все"
            anyEquipment="Все"
            labelled
            homeHint={homeHint(homeEquipment)}
          />

          {catalog.isPending && (
            <Loading>
              <CatalogListSkeleton />
            </Loading>
          )}

          {catalog.isError && (
            <EmptyState
              title="Каталог не загрузился"
              description="Проверьте соединение и попробуйте ещё раз."
            >
              <Button
                variant="outline"
                className="min-h-11 rounded-lg px-4"
                onClick={() => void catalog.refetch()}
              >
                Повторить
              </Button>
            </EmptyState>
          )}

          {catalog.data && visible.length > 0 && (
            <CatalogList
              visible={visible}
              total={view.total}
              count={view.count}
              current={view.current}
              homeEquipment={homeEquipment}
              onOpen={view.open}
              onMore={view.showMore}
            />
          )}

          {catalog.data && visible.length === 0 && (
            <EmptyState
              title="Ничего не найдено"
              description={`Нет упражнений ${view.emptyText}. Проверьте написание или ослабьте фильтры.`}
            >
              <Button variant="outline" className="min-h-11 rounded-lg px-4" onClick={view.reset}>
                Сбросить поиск и фильтры
              </Button>
            </EmptyState>
          )}
        </section>

        {desktop && (
          <DetailsPanel
            uid={user.uid}
            exerciseId={view.panelId}
            homeEquipment={homeEquipment}
            loaded={catalog.data !== undefined}
          />
        )}
      </div>

      <ScrollTop />

      {!desktop && selected && (
        <ExerciseDetails
          exerciseId={selected}
          homeEquipment={homeEquipment}
          open={view.sheetOpen}
          onOpenChange={view.setSheetOpen}
        >
          <AddToSet uid={user.uid} exerciseId={selected} homeEquipment={homeEquipment} />
        </ExerciseDetails>
      )}
    </>
  )
}
