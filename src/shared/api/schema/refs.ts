import { collection, doc } from 'firebase/firestore'

import { db } from '../firebase'
import {
  exerciseStatsConverter,
  profileConverter,
  templateConverter,
  workoutConverter,
} from './converter'

export const profileRef = (uid: string) => doc(db, 'users', uid).withConverter(profileConverter)

export const templatesRef = (uid: string) =>
  collection(db, 'users', uid, 'templates').withConverter(templateConverter)

export const templateRef = (uid: string, templateId: string) => doc(templatesRef(uid), templateId)

export const workoutsRef = (uid: string) =>
  collection(db, 'users', uid, 'workouts').withConverter(workoutConverter)

export const workoutRef = (uid: string, workoutId: string) => doc(workoutsRef(uid), workoutId)

export const exerciseStatsRef = (uid: string) =>
  collection(db, 'users', uid, 'exerciseStats').withConverter(exerciseStatsConverter)

export const exerciseStatRef = (uid: string, exerciseId: string) =>
  doc(exerciseStatsRef(uid), exerciseId)
