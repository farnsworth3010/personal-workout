// The bounds the converters enforce; editors and stores read them here so the UI cannot accept
// what a save would reject.
export const limits = {
  templateName: { max: 60 },
  templateEntries: { max: 40 },
  workoutEntries: { max: 60 },
  // Sets planned for one weekday of the schedule.
  daySets: { max: 5 },
  sets: { min: 1, max: 20 },
  reps: { min: 1, max: 200 },
  durationSec: { min: 5, max: 7200 },
  restSec: { min: 0, max: 900 },
} as const
