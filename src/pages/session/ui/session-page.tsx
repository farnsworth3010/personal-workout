import { useEffect, useMemo, useState } from 'react'
import { cn } from 'cn'
import { useNavigate } from 'react-router'

import { findExercise, isGymOnly, photoUrl, useCatalog, type Exercise } from '@/entities/exercise'
import { useProfile } from '@/entities/profile'
import {
  elapsed,
  formatClock,
  predictSet,
  restRemaining,
  timedRemaining,
  useSessionStore,
} from '@/entities/session'
import { useExerciseStats } from '@/entities/workout'
import { PickExerciseSheet } from '@/features/pick-exercise'
import type { AuthUser } from '@/shared/api'
import { playSignal, useWakeLock } from '@/shared/lib'
import { Badge, HoldButton, toast } from '@/shared/ui'
import { ExerciseDetails } from '@/widgets/exercise-details'

import { tagsText } from '../lib/format'
import { doneValues, newEntry } from '../lib/plan'
import { useAutosave } from '../model/use-autosave'
import { useNow } from '../model/use-now'
import { useSessionSignals } from '../model/use-session-signals'
import { PostponedChip, PostponedSheet } from './postponed'
import { AddModeSheet } from './quick-add'
import { RestPanel } from './rest-panel'
import { WorkPanel } from './work-panel'

// Work and rest swap in place; each one slides in when it mounts.
const EXERCISE_ENTER = 'animate-in fade-in-0 duration-300'

export function SessionPage({ user }: { user: AuthUser }) {
  const session = useSessionStore()
  const { workout, current, setIndex, restEndsAt, finishing } = session
  const navigate = useNavigate()
  const now = useNow()
  const { profile } = useProfile(user.uid)
  const { data: catalog } = useCatalog()
  const entries = workout?.entries
  const ids = useMemo(() => [...new Set(entries?.map((entry) => entry.exerciseId))], [entries])
  const stats = useExerciseStats(user.uid, ids)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [postponedOpen, setPostponedOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<Exercise>()

  const soundsOn = profile?.sounds !== false
  // Each clock can be switched off in settings; a timed set's countdown is the exercise, so it stays.
  const timers = profile?.timers ?? { exercise: true, rest: true, workout: true }

  useWakeLock(workout !== null && !finishing)
  useAutosave(user.uid, session)

  const postponedCount = entries?.filter((entry) => entry.status === 'postponed').length ?? 0
  const queueOver = workout !== null && current === null && !finishing

  // The end of the queue with nothing postponed ends the workout.
  useEffect(() => {
    if (!queueOver || postponedCount > 0) return

    if (soundsOn) playSignal('workout-done')
    useSessionStore.getState().end()
    void navigate('/session/finish')
  }, [queueOver, postponedCount, navigate, soundsOn])

  // The card of the last exercise stays behind the end-of-queue prompt.
  const index = current ?? (entries?.length ?? 1) - 1
  const entry = entries?.[index]
  const exercise = catalog && entry && findExercise(catalog, entry.exerciseId)
  const timed = entry?.kind === 'timed' || entry?.kind === 'cardio'
  const resting = restEndsAt !== null
  const timedLeft = timedRemaining(session.setStartedAt ?? now, entry?.plan.durationSec ?? 0, now)
  const timeUp = timed && !resting && timedLeft === 0
  const restOver = timers.rest && resting && restRemaining(restEndsAt, now) === 0

  useSessionSignals({ timeUp, restOver, restEndsAt, soundsOn, now })

  if (!workout || !entry) return null

  const homeEquipment = profile?.homeEquipment ?? []
  const stat = stats?.[entry.exerciseId]
  const n = setIndex + 1
  const prediction = predictSet(n, entry.plan, stat?.lastSets, session.shiftKg[entry.id])
  const logged = entry.sets.find((set) => set.n === n)
  const alt = Math.floor(now / 1000) % 2 === 1

  const endWorkout = () => {
    if (soundsOn) playSignal('workout-done')
    session.end()
    void navigate('/session/finish')
  }

  const next = () => {
    session.next()

    if (useSessionStore.getState().current !== current) toast('Упражнение завершено')
  }

  return (
    <div className="flex min-h-[calc(100dvh-2.25rem)] min-w-0 flex-col gap-3 min-[900px]:min-h-[calc(100dvh-4.25rem)] min-[900px]:gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-muted-foreground">
        <HoldButton
          label="Завершить"
          className="min-h-11 justify-self-start rounded-md border border-border px-3.5 text-sm text-foreground"
          onConfirm={endWorkout}
        />
        <span className="text-base font-semibold text-foreground tabular-nums">
          {timers.workout && formatClock(elapsed(workout.startedAt.toMillis(), now), 2)}
        </span>
        <span className="justify-self-end tabular-nums">
          {index + 1} / {workout.entries.length}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <i
          className="block h-full bg-primary"
          style={{ width: `${((index + 1) / workout.entries.length) * 100}%` }}
        />
      </div>

      <PostponedChip count={postponedCount} onOpen={() => setPostponedOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 min-[900px]:flex-row min-[900px]:gap-8">
        {/* Photo and title are keyed by position, so a new exercise fades in; the buttons are not:
            a remounted hold button would take the click that follows a touch hold as a mouse click. */}
        <div
          key={entry.id}
          className={cn(
            'relative flex-1 overflow-hidden rounded-md border border-border bg-surface min-[900px]:flex-[1.2]',
            EXERCISE_ENTER,
            resting ? 'min-h-[130px]' : 'min-h-[200px]',
            // Short phones give the photo what is left, so 'Подход сделан' stays on screen.
            '[@media(max-height:719px)]:min-h-16',
          )}
        >
          {[0, 1].map((photo) => {
            const src = exercise && photoUrl(exercise, photo)

            return (
              src && (
                <img
                  key={src}
                  src={src}
                  alt={`${entry.name}: ${photo ? 'конец' : 'начало'} движения`}
                  className={cn(
                    'absolute inset-0 size-full object-cover transition-opacity duration-250',
                    photo === 1 && !alt && 'opacity-0',
                  )}
                />
              )
            )
          })}
          {exercise && isGymOnly(exercise, homeEquipment) && (
            <Badge className="absolute top-2.5 left-2.5">Зал</Badge>
          )}
          <button
            type="button"
            aria-label="Описание упражнения"
            className="absolute top-1 right-1 size-11 rounded-full bg-scrim text-xl font-bold text-foreground"
            onClick={() => setDetailsOpen(true)}
          >
            i
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-3 min-[900px]:flex-1 min-[900px]:justify-center min-[900px]:gap-5">
          <div key={entry.id} className={EXERCISE_ENTER}>
            <p className="mb-1 text-[13px] text-muted-foreground">{workout.template.name}</p>
            <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase min-[900px]:text-[40px]">
              {entry.name}
            </h1>
            {exercise && <p className="text-sm text-muted-foreground">{tagsText(exercise)}</p>}
          </div>

          {resting ? (
            <RestPanel
              entry={entry}
              n={n}
              logged={logged ?? prediction.values}
              last={prediction.last}
              remainingSec={timers.rest ? (restRemaining(restEndsAt, now) ?? 0) : undefined}
              weightStepKg={stat?.weightStepKg ?? profile?.defaultWeightStepKg ?? 2.5}
              onEdit={session.editSet}
              onNext={next}
            />
          ) : (
            <WorkPanel
              entry={entry}
              n={n}
              predicted={prediction.values}
              timedLeft={timed ? timedLeft : undefined}
              exerciseSec={
                timers.exercise ? elapsed(session.exerciseStartedAt ?? now, now) : undefined
              }
              onBack={() => session.back()}
              onAdd={() => setPicking(true)}
              onPostpone={() => {
                session.postpone()
                toast('Упражнение отложено')
              }}
              onDone={() => {
                const at = Date.now()

                session.completeSet(
                  doneValues(entry.kind, prediction.values, session.setStartedAt, at),
                  at,
                )
                if (soundsOn) playSignal('set-done')
              }}
            />
          )}
        </div>
      </div>

      <ExerciseDetails
        exerciseId={entry.exerciseId}
        homeEquipment={homeEquipment}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <PostponedSheet
        entries={workout.entries}
        catalog={catalog}
        ending={queueOver}
        open={postponedOpen || (queueOver && postponedCount > 0)}
        onOpenChange={setPostponedOpen}
        onResume={(id) => {
          session.resume(id)
          setPostponedOpen(false)
        }}
        onFinish={endWorkout}
      />

      <PickExerciseSheet
        title="Добавить упражнение"
        open={picking}
        onOpenChange={setPicking}
        homeEquipment={homeEquipment}
        onPick={(id) => {
          setPicking(false)
          setPicked(catalog && findExercise(catalog, id))
        }}
        onDetails={setDetailsId}
      />

      {/* The details of an exercise in the picker, over the picker. */}
      <ExerciseDetails
        exerciseId={detailsId ?? ''}
        homeEquipment={homeEquipment}
        open={detailsId !== null}
        onOpenChange={(open) => !open && setDetailsId(null)}
      />

      <AddModeSheet
        name={picked?.name}
        canDefer={!queueOver}
        onClose={() => setPicked(undefined)}
        onChoose={(mode) => {
          if (picked) session.addExercise(newEntry(picked, profile?.defaultRestSec ?? 90), mode)
          setPicked(undefined)
          toast('Упражнение добавлено')
        }}
      />
    </div>
  )
}
