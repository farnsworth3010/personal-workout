import type { Destination } from '../model/types'

// Icon paths from ../personal-workout-design/home.html.
export const destinations: Destination[] = [
  {
    to: '/',
    label: 'Сегодня',
    icon: [{ d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' }],
  },
  {
    to: '/templates',
    label: 'Наборы',
    icon: [{ d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' }],
  },
  {
    to: '/exercises',
    label: 'Упражнения',
    icon: [{ d: 'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11' }],
  },
  { to: '/stats', label: 'Статистика', icon: [{ d: 'M3 3v18h18M7 15l4-4 3 3 5-6' }] },
  {
    to: '/settings',
    label: 'Профиль',
    icon: [{ cx: 12, cy: 8, r: 4 }, { d: 'M4 21a8 8 0 0 1 16 0' }],
  },
]
