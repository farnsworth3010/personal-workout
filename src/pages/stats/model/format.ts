const n1Format = new Intl.NumberFormat('ru', { maximumFractionDigits: 1 })

export const n1 = (value: number) => n1Format.format(value)

// Russian plural forms [one, few, many]; fractions take the "few" form (0,5 подхода).
export function plural(n: number, [one, few, many]: readonly [string, string, string]) {
  if (!Number.isInteger(n)) return few

  const tens = n % 100
  const units = n % 10
  if (tens > 10 && tens < 20) return many
  return units === 1 ? one : units > 1 && units < 5 ? few : many
}

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

/** "Среда, 11 ноября" */
export function longDate(d: Date) {
  const text = d.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const formatWorkouts = (n: number) =>
  `${n} ${plural(n, ['тренировка', 'тренировки', 'тренировок'])}`
