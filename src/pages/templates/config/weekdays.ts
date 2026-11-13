import type { Weekday } from '@/entities/profile'

// Dative plural, for «по понедельникам».
export const weekdayDatives: Record<Weekday, string> = {
  mon: 'понедельникам',
  tue: 'вторникам',
  wed: 'средам',
  thu: 'четвергам',
  fri: 'пятницам',
  sat: 'субботам',
  sun: 'воскресеньям',
}
