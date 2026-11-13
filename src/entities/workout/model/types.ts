export interface HistoryRange {
  from: Date
  // Exclusive, so consecutive weeks or months never share a workout.
  to: Date
}
