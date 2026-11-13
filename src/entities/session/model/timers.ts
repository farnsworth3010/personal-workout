// Every timer is derived from a stored timestamp and the current time, so sleep, reload or a
// closed app cannot make it drift. All values are whole seconds, all timestamps epoch ms.

const elapsedSec = (since: number, now: number) => Math.max(0, Math.floor((now - since) / 1000))

const remainingSec = (until: number, now: number) => Math.max(0, Math.ceil((until - now) / 1000))

// Total workout time and time on the current exercise.
export const elapsed = elapsedSec

// Rest countdown; null when no rest is running.
export const restRemaining = (restEndsAt: number | null, now: number) =>
  restEndsAt === null ? null : remainingSec(restEndsAt, now)

// Countdown of a timed set that started at setStartedAt.
export const timedRemaining = (setStartedAt: number, durationSec: number, now: number) =>
  remainingSec(setStartedAt + durationSec * 1000, now)
