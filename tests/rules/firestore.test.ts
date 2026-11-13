import { readFileSync } from 'node:fs'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { Timestamp } from 'firebase/firestore'

import type { ExerciseStats, Workout } from '@/shared/api'

import { defaultProfile } from '../../src/entities/profile/model/profile'
import { exerciseStatsAfter, finishedWorkout } from '../../src/entities/workout/api/documents'
import { extraCases, fieldValues, kinds } from './samples'

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST

// Collections whose documents a user may list; the profile is a single document.
const collectionOf = (path: string) => path.split('/').slice(0, -1).join('/')
const subcollections = kinds.filter((k) => k.kind !== 'profile')

describe.skipIf(!emulatorHost)(
  'Firestore rules (needs FIRESTORE_EMULATOR_HOST: run `pnpm test:rules`)',
  () => {
    let env: RulesTestEnvironment
    const as = (uid: string | null) =>
      (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore()

    // Rejects anything but a permission denial, so a broken sample cannot pass as "denied".
    const allowed = (write: Promise<unknown>) =>
      write.then(
        () => true,
        (error: unknown) => {
          if ((error as { code?: string }).code === 'permission-denied') return false
          throw error
        },
      )

    beforeAll(async () => {
      env = await initializeTestEnvironment({
        projectId: 'demo-workout',
        firestore: { rules: readFileSync('firestore.rules', 'utf8') },
      })
    })

    beforeEach(async () => {
      await env.clearFirestore()
      await env.withSecurityRulesDisabled(async (ctx) => {
        for (const uid of ['A', 'B'])
          for (const { path, sample } of kinds) await ctx.firestore().doc(path(uid)).set(sample)
      })
    })

    afterAll(async () => {
      await env.cleanup()
    })

    describe('1. unauthenticated', () => {
      it.each(kinds)('denies every read and write of $kind', async ({ path, sample }) => {
        const db = as(null)

        await assertFails(db.doc(path('A')).get())
        await assertFails(db.doc(path('A')).set(sample))
        await assertFails(db.doc(path('A')).delete())
        await assertFails(db.doc(path('anon')).set(sample))
      })

      it.each(subcollections)('denies listing $kind', async ({ path }) => {
        await assertFails(
          as(null)
            .collection(collectionOf(path('A')))
            .get(),
        )
      })

      it('denies paths outside /users', async () => {
        await assertFails(as(null).doc('catalog/x').get())
        await assertFails(as(null).doc('catalog/x').set({ a: 1 }))
      })
    })

    describe('2. owner', () => {
      it.each(kinds)('reads, creates, updates and deletes own $kind', async ({ path, sample }) => {
        const db = as('A')
        const ref = db.doc(path('A'))

        await assertSucceeds(ref.get())
        await assertSucceeds(ref.delete())
        await assertSucceeds(ref.set(sample))
        await assertSucceeds(ref.set(sample))
      })

      it.each(subcollections)('lists own $kind', async ({ path }) => {
        await assertSucceeds(
          as('A')
            .collection(collectionOf(path('A')))
            .get(),
        )
      })

      it('denies paths outside /users to a signed-in user', async () => {
        await assertFails(as('A').doc('catalog/x').get())
        await assertFails(as('A').doc('users/A/other/x').set({ a: 1 }))
      })
    })

    describe("3. another user's data", () => {
      it.each(kinds)("denies every read and write of B's $kind to A", async ({ path, sample }) => {
        const db = as('A')

        await assertFails(db.doc(path('B')).get())
        await assertFails(db.doc(path('B')).set(sample))
        await assertFails(db.doc(path('B')).delete())
        await assertFails(db.doc(path('C')).set(sample))
      })

      it.each(subcollections)("denies listing B's $kind to A", async ({ path }) => {
        await assertFails(
          as('A')
            .collection(collectionOf(path('B')))
            .get(),
        )
      })
    })

    describe('4. document shape: rules agree with the zod schema', () => {
      it.each(kinds)('$kind sample covers every key of the schema', ({ schema, sample }) => {
        expect(Object.keys(sample).sort()).toEqual(Object.keys(schema.shape).sort())
      })

      it.each(kinds)(
        '$kind: an extra top-level key is rejected',
        async ({ path, schema, sample }) => {
          const doc = { ...sample, extra: 1 }

          expect(schema.safeParse(doc).success).toBe(false)
          await assertFails(as('A').doc(path('A')).set(doc))
        },
      )

      it.each(kinds)(
        '$kind: missing keys and wrong field values',
        async ({ kind, path, schema, sample }) => {
          const ref = as('A').doc(path('A'))
          const docs: [string, Record<string, unknown>][] = []
          for (const key of Object.keys(sample)) {
            const without = Object.entries(sample).filter(([k]) => k !== key)
            docs.push([`without ${key}`, Object.fromEntries(without)])
            for (const value of fieldValues)
              docs.push([`${key}: ${JSON.stringify(value)}`, { ...sample, [key]: value }])
          }
          for (const c of extraCases.filter((e) => e.kind === kind))
            docs.push([JSON.stringify(c.patch).slice(0, 80), { ...sample, ...c.patch }])

          const mismatches: string[] = []
          for (const [label, doc] of docs) {
            const expected = schema.safeParse(doc).success
            if ((await allowed(ref.set(doc))) !== expected)
              mismatches.push(`${label}: schema ${expected ? 'accepts' : 'rejects'}`)
          }

          expect(mismatches).toEqual([])
        },
      )
    })

    describe('5. queries outside one user', () => {
      it.each(subcollections)('denies a collection-group query on $kind', async ({ path }) => {
        const group = collectionOf(path('A')).split('/').at(-1) ?? ''

        await assertFails(as('A').collectionGroup(group).get())
      })

      it('denies listing /users', async () => {
        await assertFails(as('A').collection('users').get())
        await assertFails(as('A').collection('users').where('sounds', '==', true).get())
      })
    })

    describe('6. documents written by @/entities/workout and @/entities/profile', () => {
      const done = kinds[2].sample as Workout
      const active: Workout = { ...done, status: 'active', endedAt: null, summary: null }
      const previous = kinds[3].sample as ExerciseStats
      const now = Timestamp.fromMillis(1_700_000_900_000)

      it('accepts the active workout under an auto id and a UUID', async () => {
        await assertSucceeds(as('A').doc('users/A/workouts/Xh3kq9TzQm2bV7cLp0aR').set(active))
        await assertSucceeds(as('A').doc(`users/A/workouts/${crypto.randomUUID()}`).set(active))
      })

      it('accepts the finished workout and its exerciseStats', async () => {
        const facts = { Pushups: { primaryMuscles: ['chest' as const], secondaryMuscles: [] } }
        const stats = [
          ...Object.entries(exerciseStatsAfter('w1', active, { Pushups: previous }, now)),
          ...Object.entries(exerciseStatsAfter('w1', active, {}, now)),
        ]
        expect(stats.length).toBe(2)

        await assertSucceeds(
          as('A')
            .doc('users/A/workouts/w1')
            .set(finishedWorkout(active, facts, now)),
        )
        for (const [id, doc] of stats)
          await assertSucceeds(as('A').doc(`users/A/exerciseStats/${id}`).set(doc))
      })

      it('accepts the default profile ensureProfile creates for a new user', async () => {
        await assertSucceeds(
          as('N')
            .doc('users/N')
            .set({ ...defaultProfile, updatedAt: now }),
        )
      })

      it('lets the owner batch-delete all workouts and stats, keeping templates; nobody else', async () => {
        const paths = ['users/A/workouts/w1', 'users/A/exerciseStats/Pushups']
        const deleteAll = (db: ReturnType<typeof as>) => {
          const batch = db.batch()
          for (const path of paths) batch.delete(db.doc(path))
          return batch.commit()
        }

        await assertFails(deleteAll(as('B')))
        await assertFails(deleteAll(as(null)))
        await assertSucceeds(deleteAll(as('A')))
        await assertSucceeds(as('A').doc('users/A/templates/t1').get())
        expect((await as('A').doc('users/A/templates/t1').get()).exists).toBe(true)
      })

      it('lets a profile written before the timer switches take a merge, and the switches later', async () => {
        const old: Partial<typeof defaultProfile> = { ...defaultProfile, updatedAt: now }
        delete old.timers
        await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc('users/O').set(old))

        await assertSucceeds(
          as('O').doc('users/O').set({ sounds: false, updatedAt: now }, { merge: true }),
        )
        // Maps merge key by key: one switch alone would leave the profile with a partial `timers`.
        await assertFails(
          as('O')
            .doc('users/O')
            .set({ timers: { rest: false }, updatedAt: now }, { merge: true }),
        )
        await assertSucceeds(
          as('O')
            .doc('users/O')
            .set(
              { timers: { exercise: false, rest: true, workout: true }, updatedAt: now },
              { merge: true },
            ),
        )
      })

      it('lets a profile with the retired activeWorkoutId and places take merges', async () => {
        const old = {
          ...defaultProfile,
          activeWorkoutId: 'w1',
          places: { mon: 'gym', tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
          updatedAt: now,
        }
        await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc('users/O').set(old))
        const ref = as('O').doc('users/O')

        await assertSucceeds(ref.set({ sounds: false, updatedAt: now }, { merge: true }))
        await assertSucceeds(
          ref.set({ schedule: defaultProfile.schedule, updatedAt: now }, { merge: true }),
        )
        await assertFails(ref.set({ activeWorkoutId: 7, updatedAt: now }, { merge: true }))
        await assertFails(ref.set({ places: 'gym', updatedAt: now }, { merge: true }))
      })

      it('accepts the reset of a schedule on an existing profile only', async () => {
        const reset = { schedule: defaultProfile.schedule, updatedAt: now }

        await assertSucceeds(as('A').doc('users/A').set(reset, { merge: true }))
        await assertFails(as('A').doc('users/C').set(reset, { merge: true }))
      })
    })
  },
)
