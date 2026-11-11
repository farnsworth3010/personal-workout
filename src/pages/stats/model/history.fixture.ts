import { Timestamp } from 'firebase/firestore'

import type { LoggedSet, Workout, WorkoutEntry } from '@/shared/api'

import { addDays } from './dates'

// Deterministic history like stats.html: Mon and Fri at home, Wed in the gym, 3 Aug – 11 Nov 2026.
const skipped = new Set(['2026-7-21', '2026-8-23', '2026-7-5'])

const gymMuscles = {
  chest: 8,
  triceps: 5,
  shoulders: 8,
  quadriceps: 4,
  hamstrings: 2,
  glutes: 2,
  calves: 2,
  abdominals: 3,
}
const homeMuscles = {
  lats: 11.5,
  'middle back': 11,
  biceps: 7.5,
  shoulders: 7.5,
  triceps: 5,
  abdominals: 3,
}

const entry = (
  exerciseId: string,
  name: string,
  reps: number[],
  weightKg: number | null,
  at: Timestamp,
): WorkoutEntry => ({
  exerciseId,
  name,
  kind: weightKg === null ? 'bodyweight' : 'strength',
  status: 'done',
  plan: { sets: reps.length, reps: reps[0] ?? 10, restSec: 90 },
  sets: reps.map((r, i): LoggedSet => ({
    n: i + 1,
    reps: r,
    ...(weightKg === null ? {} : { weightKg }),
    at,
  })),
})

const step = (from: number, to: number, t: number, by: number) =>
  Math.round((from + (to - from) * t) / by) * by

export function seedHistory(now: Date): Workout[] {
  const days: Date[] = []
  for (let d = new Date(2026, 7, 3, 18); d <= now; d = addDays(d, 1)) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if ([1, 3, 5].includes(d.getDay()) && !skipped.has(key)) {
      days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18))
    }
  }

  return days.map((date, i) => {
    const t = i / Math.max(1, days.length - 1)
    const gym = date.getDay() === 3
    const at = Timestamp.fromDate(date)
    const entries = gym
      ? [
          entry(
            'Barbell_Bench_Press_-_Medium_Grip',
            'Barbell Bench Press',
            [10, 10, 8, 6],
            step(52.5, 62.5, t, 2.5),
            at,
          ),
          entry('Leg_Press', 'Leg Press', [12, 12, 12, 12], step(110, 140, t, 5), at),
        ]
      : [
          entry('Pullups', 'Pullups', [8, 8, 7, 6], null, at),
          entry(
            'Dumbbell_Shoulder_Press',
            'Dumbbell Shoulder Press',
            [10, 10, 9],
            step(14, 18, t, 1),
            at,
          ),
        ]

    return {
      status: 'done',
      startedAt: at,
      endedAt: at,
      template: gym
        ? { source: 'ready', id: 'gym-full-body', name: 'Зал: всё тело' }
        : { source: 'ready', id: 'home-dumbbells-bar', name: 'Дом: гантели и турник' },
      entries,
      survey:
        i % 3 === 2 && !gym
          ? {}
          : {
              bodyWeightKg: Math.round((84.6 - 2.2 * t + ((i % 4) - 1.5) * 0.15) * 10) / 10,
              wellbeing: 3 + (i % 3 === 0 ? 1 : 0) + (i % 5 === 0 ? 1 : 0),
              energy: 2 + (i % 2) + (i % 7 === 0 ? 2 : 0),
            },
      summary: {
        durationSec: (gym ? 55 : 40) * 60 + (i % 4) * 180,
        volumeKg: 0,
        setsDone: 8,
        muscleSets: gym ? gymMuscles : homeMuscles,
      },
      updatedAt: at,
    }
  })
}
