import type { FinishedWorkout, SessionData } from './types'

// A running session the screen can show; false while the finish screen waits.
export const selectActive = (s: SessionData) => s.workout !== null && s.finished === null

// The ended workout waiting for the survey; a stored object, so the selector is stable.
export const selectFinishing = (s: SessionData): FinishedWorkout | null => s.finished
