import type { Equipment } from '@/entities/exercise'

export const weightSteps = [0.5, 1, 2.5, 5] as const

export const toggles = [
  { key: 'sounds', label: 'Звуки', hint: 'Конец отдыха и таймера, подход и тренировка завершены' },
  { key: 'animations', label: 'Анимации', hint: 'Переходы между экранами и отклик кнопок' },
] as const

export const timers = [
  { key: 'exercise', label: 'Время упражнения', hint: 'Сколько идёт текущий подход' },
  { key: 'rest', label: 'Отдых', hint: 'Обратный отсчёт между подходами' },
  { key: 'workout', label: 'Общее время тренировки', hint: 'С начала тренировки' },
] as const

// Body weight is always available, so it is shown checked and never stored.
export const ALWAYS: Equipment = 'body only'
