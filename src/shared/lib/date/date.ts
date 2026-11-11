// Calendar arithmetic in local time: days step by date, not by 24 h, so DST changes do not shift them.
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

/** Monday of the week that contains `d`. */
export const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))
