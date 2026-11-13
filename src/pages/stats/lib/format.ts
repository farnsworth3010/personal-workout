import { capitalize, n1, plural } from '@/shared/lib'

export const formatSets = (sets: number) =>
  `${n1(sets)} ${plural(sets, ['подход', 'подхода', 'подходов'])}`

const monthNames = [
  ['январь', 'января', 'январе', 'янв'],
  ['февраль', 'февраля', 'феврале', 'фев'],
  ['март', 'марта', 'марте', 'мар'],
  ['апрель', 'апреля', 'апреле', 'апр'],
  ['май', 'мая', 'мае', 'мая'],
  ['июнь', 'июня', 'июне', 'июн'],
  ['июль', 'июля', 'июле', 'июл'],
  ['август', 'августа', 'августе', 'авг'],
  ['сентябрь', 'сентября', 'сентябре', 'сен'],
  ['октябрь', 'октября', 'октябре', 'окт'],
  ['ноябрь', 'ноября', 'ноябре', 'ноя'],
  ['декабрь', 'декабря', 'декабре', 'дек'],
] as const

const month = (d: Date) => monthNames[d.getMonth()]

/** "ноябрь 2026" */
export const monthTitle = (d: Date) => `${month(d)[0]} ${d.getFullYear()}`

/** "В ноябре" */
export const inMonth = (d: Date) => `В ${month(d)[2]}`

/** "11 ноября" */
export const dayMonth = (d: Date) => `${d.getDate()} ${month(d)[1]}`

/** "11 ноя" for chart axes and record dates. */
export const dayShort = (d: Date) => `${d.getDate()} ${month(d)[3]}`

export const monthShort = (d: Date) => month(d)[3]

/** "9–11 ноября", "30 ноября – 2 декабря" or "9 ноября". */
export function dayRange(from: Date, to: Date) {
  if (from.toDateString() === to.toDateString()) return dayMonth(from)
  if (from.getMonth() === to.getMonth()) return `${from.getDate()}–${dayMonth(to)}`
  return `${dayMonth(from)} – ${dayMonth(to)}`
}

export const formatWorkouts = (n: number) =>
  `${n} ${plural(n, ['тренировка', 'тренировки', 'тренировок'])}`

/** A total time in whole hours from one hour up, else in minutes. */
export const formatTotal = (sec: number) =>
  sec >= 3600
    ? { value: Math.round(sec / 3600), unit: 'ч' }
    : { value: Math.round(sec / 60), unit: 'мин' }

// 1 January 2024 is a Monday: «Пн» … «Вс» in the locale's own short names.
export const weekdayNames = Array.from({ length: 7 }, (_, i) =>
  capitalize(new Date(2024, 0, 1 + i).toLocaleDateString('ru', { weekday: 'short' })),
)
