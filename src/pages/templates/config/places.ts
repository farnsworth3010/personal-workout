import { placeLabels, type Place } from '@/entities/template'

export const placeFilters: { place: Place | null; label: string }[] = [
  { place: 'home', label: placeLabels.home },
  { place: 'gym', label: placeLabels.gym },
  { place: null, label: 'Все' },
]
