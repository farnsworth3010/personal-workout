import { Link } from 'react-router'

import type { Place } from '@/entities/template'
import { Button, Chip, PageHeader } from '@/shared/ui'

import { placeFilters } from '../../config/places'

interface TemplatesToolbarProps {
  filter: Place | null
  onFilter: (place: Place | null) => void
}

export function TemplatesToolbar({ filter, onFilter }: TemplatesToolbarProps) {
  return (
    // Pinned on desktop while the lists scroll; the negative margins stretch it over ScreenLayout's padding.
    <div className="flex flex-col gap-3.5 min-[900px]:sticky min-[900px]:top-0 min-[900px]:z-10 min-[900px]:-mx-10 min-[900px]:-mt-7 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-6 min-[900px]:bg-background min-[900px]:px-10 min-[900px]:pt-7 min-[900px]:pb-4">
      <PageHeader
        title="Наборы"
        subtitle="Шаблоны тренировок: порядок упражнений, подходы и отдых"
      />
      <div className="flex flex-col gap-3.5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-3">
        <div
          role="group"
          aria-label="Где тренироваться"
          className="grid grid-cols-3 gap-1.5 min-[900px]:w-[300px]"
        >
          {placeFilters.map(({ place, label }) => (
            <Chip key={label} pressed={filter === place} onPressedChange={() => onFilter(place)}>
              {label}
            </Chip>
          ))}
        </div>
        <Button
          asChild
          className="h-auto min-h-13 rounded-lg border-0 px-6 text-[17px] font-bold uppercase"
        >
          <Link to="/templates/new">Создать набор</Link>
        </Button>
      </div>
    </div>
  )
}
