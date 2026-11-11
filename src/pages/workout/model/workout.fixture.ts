import { Timestamp } from 'firebase/firestore'

import type { Workout, WorkoutEntry } from '@/shared/api'

const at = (h: number, m: number) => Timestamp.fromDate(new Date(2026, 10, 11, h, m))

const entry = (
  exerciseId: string,
  kind: WorkoutEntry['kind'],
  status: WorkoutEntry['status'],
  planned: number,
  sets: { reps?: number; weightKg?: number; durationSec?: number }[],
): WorkoutEntry => ({
  id: exerciseId,
  exerciseId,
  name: exerciseId.replaceAll('_', ' '),
  kind,
  status,
  plan:
    kind === 'timed'
      ? { sets: planned, durationSec: 60, restSec: 60 }
      : { sets: planned, reps: 10, restSec: 90 },
  sets: sets.map((s, i) => ({ n: i + 1, ...s, at: at(18, 10 + i) })),
})

// A finished gym workout like workout.html: done, partly done, skipped and timed entries.
export const finishedWorkout = (): Workout => ({
  status: 'done',
  startedAt: at(18, 2),
  endedAt: at(19, 0),
  template: { source: 'ready', id: 'gym-full-body', name: 'Зал: всё тело' },
  entries: [
    entry('Barbell_Bench_Press_-_Medium_Grip', 'strength', 'done', 4, [
      { reps: 10, weightKg: 60 },
      { reps: 10, weightKg: 60 },
      { reps: 8, weightKg: 62.5 },
      { reps: 6, weightKg: 62.5 },
    ]),
    entry('Seated_Cable_Rows', 'strength', 'skipped', 4, [
      { reps: 12, weightKg: 50 },
      { reps: 12, weightKg: 50 },
    ]),
    entry('Barbell_Curl', 'strength', 'skipped', 3, []),
    entry('Pullups', 'bodyweight', 'done', 2, [{ reps: 8 }, { reps: 7 }]),
    entry('Plank', 'timed', 'done', 2, [{ durationSec: 60 }, { durationSec: 45 }]),
  ],
  survey: { wellbeing: 4, energy: 3, bodyWeightKg: 82.1 },
  summary: { durationSec: 3520, volumeKg: 3275, setsDone: 10, muscleSets: { chest: 4 } },
  updatedAt: at(19, 0),
})
