import { useState } from 'react'
import { useNavigate } from 'react-router'

import { findExercise, type Exercise } from '@/entities/exercise'
import { elapsed, predictSet, restRemaining, useSessionStore } from '@/entities/session'
import { PickExerciseSheet } from '@/features/pick-exercise'
import type { AuthUser } from '@/shared/api'
import { playSignal, useWakeLock } from '@/shared/lib'
import { Title, toast } from '@/shared/ui'
import { ExerciseDetails } from '@/widgets/exercise-details'

import { tagsText } from '../../lib/format'
import { doneValues, newEntry } from '../../lib/plan'
import { useAutosave } from '../../model/use-autosave'
import { useSessionSignals } from '../../model/use-session-signals'
import { useSessionView } from '../../model/use-session-view'
import { AddModeSheet } from '../add-mode-sheet'
import { ExerciseCard } from '../exercise-card'
import { PostponedChip } from '../postponed-chip'
import { PostponedSheet } from '../postponed-sheet'
import { RestPanel } from '../rest-panel'
import { SessionTopBar } from '../session-top-bar'
import { WorkPanel } from '../work-panel'

export function SessionPage({ user }: { user: AuthUser }) {
  const {
    session,
    now,
    profile,
    catalog,
    stats,
    soundsOn,
    timers,
    postponedCount,
    queueOver,
    index,
    entry,
    exercise,
    timed,
    resting,
    timedLeft,
    timeUp,
    restOver,
  } = useSessionView(user.uid)
  const { workout, current, setIndex, restEndsAt, finished } = session
  const store = useSessionStore.getState()
  const navigate = useNavigate()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [postponedOpen, setPostponedOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<Exercise>()

  useWakeLock(workout !== null && finished === null)
  useAutosave(user.uid, session)

  useSessionSignals({ timeUp, restOver, restEndsAt, soundsOn, now })

  if (!workout || !entry) return null

  const { homeEquipment } = profile
  const stat = stats?.[entry.exerciseId]
  const n = setIndex + 1
  const prediction = predictSet(n, entry.plan, stat?.lastSets, session.shiftKg[entry.id])
  const logged = entry.sets.find((set) => set.n === n)
  const alt = Math.floor(now / 1000) % 2 === 1

  const endWorkout = () => {
    if (soundsOn) playSignal('workout-done')
    store.end()
    void navigate('/session/finish')
  }

  // The store ends the workout past the last exercise; the page only adds the sound.
  const next = () => {
    store.next()

    if (useSessionStore.getState().finished && soundsOn) playSignal('workout-done')

    if (useSessionStore.getState().current !== current) toast('Упражнение завершено')
  }

  return (
    <div className="flex min-h-[calc(100dvh-2.25rem)] min-w-0 flex-col gap-3 min-[900px]:min-h-[calc(100dvh-4.25rem)] min-[900px]:gap-5">
      <SessionTopBar
        workoutSec={timers.workout ? elapsed(workout.startedAt.toMillis(), now) : undefined}
        position={index + 1}
        total={workout.entries.length}
        onEnd={endWorkout}
      />

      <PostponedChip count={postponedCount} onOpen={() => setPostponedOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 min-[900px]:flex-row min-[900px]:gap-8">
        {/* Photo and title are keyed by position, so a new exercise fades in; the buttons are not:
            a remounted hold button would take the click that follows a touch hold as a mouse click. */}
        <ExerciseCard
          key={entry.id}
          name={entry.name}
          exercise={exercise}
          homeEquipment={homeEquipment}
          resting={resting}
          alt={alt}
          onDetails={() => setDetailsOpen(true)}
        />

        <div className="flex min-w-0 flex-col gap-3 min-[900px]:flex-1 min-[900px]:justify-center min-[900px]:gap-5">
          <div key={entry.id} className="animate-in duration-300 fade-in-0">
            <p className="mb-1 text-[13px] text-muted-foreground">{workout.template.name}</p>
            <Title>{entry.name}</Title>
            {exercise && <p className="text-sm text-muted-foreground">{tagsText(exercise)}</p>}
          </div>

          {resting ? (
            <RestPanel
              entry={entry}
              n={n}
              logged={logged ?? prediction.values}
              last={prediction.last}
              remainingSec={timers.rest ? (restRemaining(restEndsAt, now) ?? 0) : undefined}
              weightStepKg={stat?.weightStepKg ?? profile.defaultWeightStepKg}
              onEdit={store.editSet}
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
              onBack={() => store.back()}
              onAdd={() => setPicking(true)}
              onPostpone={() => {
                store.postpone()
                toast('Упражнение отложено')
              }}
              onDone={() => {
                const at = Date.now()

                store.completeSet(
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
        ending={queueOver}
        open={postponedOpen || (queueOver && postponedCount > 0)}
        onOpenChange={setPostponedOpen}
        onResume={(id) => {
          store.resume(id)
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
          if (picked) store.addExercise(newEntry(picked, profile.defaultRestSec), mode)
          setPicked(undefined)
          toast('Упражнение добавлено')
        }}
      />
    </div>
  )
}
