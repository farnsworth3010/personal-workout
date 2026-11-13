import type { RecordKey, Records } from '@/entities/workout'

// A record this workout set, with the previous value as text when there was one.
export interface NewRecord {
  id: string
  key: RecordKey
  name: string
  now: Records
  was: string | undefined
}
