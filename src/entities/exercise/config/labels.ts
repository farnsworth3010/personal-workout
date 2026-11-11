import type { Equipment, ExerciseKind, Muscle } from '@/shared/api'

export const muscleLabels: Record<Muscle, string> = {
  abdominals: 'Пресс',
  abductors: 'Отводящие мышцы бедра',
  adductors: 'Приводящие мышцы бедра',
  biceps: 'Бицепс',
  calves: 'Икры',
  chest: 'Грудь',
  forearms: 'Предплечья',
  glutes: 'Ягодицы',
  hamstrings: 'Задняя поверхность бедра',
  lats: 'Широчайшие',
  'lower back': 'Поясница',
  'middle back': 'Середина спины',
  neck: 'Шея',
  quadriceps: 'Квадрицепс',
  shoulders: 'Плечи',
  traps: 'Трапеции',
  triceps: 'Трицепс',
}

// The order of equipment chips and lists; a test keeps it in step with the labels.
export const equipmentList: readonly Equipment[] = [
  'body only',
  'pull-up bar',
  'dumbbell',
  'barbell',
  'e-z curl bar',
  'kettlebells',
  'bands',
  'cable',
  'machine',
  'medicine ball',
  'exercise ball',
  'foam roll',
  'other',
]

export const equipmentLabels: Record<Equipment, string> = {
  'body only': 'Собственный вес',
  'pull-up bar': 'Турник',
  dumbbell: 'Гантели',
  barbell: 'Штанга',
  'e-z curl bar': 'EZ-гриф',
  kettlebells: 'Гири',
  bands: 'Резинки',
  cable: 'Блочный тренажёр',
  machine: 'Тренажёр',
  'medicine ball': 'Медбол',
  'exercise ball': 'Фитбол',
  'foam roll': 'Массажный ролик',
  other: 'Другое',
}

// Lower case: it follows the equipment, as in "штанга · силовое".
export const kindLabels: Record<ExerciseKind, string> = {
  strength: 'силовое',
  bodyweight: 'с весом тела',
  timed: 'на время',
  cardio: 'кардио',
}
