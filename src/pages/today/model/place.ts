import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Place } from '@/entities/template'

interface PlaceState {
  place: Place | null
}

// The device's Дома / Зал choice, kept until changed; null until the person picks one.
export const usePlaceStore = create<PlaceState>()(
  persist((): PlaceState => ({ place: null }), { name: 'workout-place' }),
)

export const choosePlace = (place: Place) => usePlaceStore.setState({ place })
