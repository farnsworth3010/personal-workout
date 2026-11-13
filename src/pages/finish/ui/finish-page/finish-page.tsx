import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { useCatalogById } from '@/entities/exercise'
import { selectFinishing, useSessionStore } from '@/entities/session'
import {
  discardWorkout,
  finishWorkout,
  recordsByExercise,
  setsDone,
  useExerciseStats,
  useLastBodyWeight,
} from '@/entities/workout'
import type { AuthUser } from '@/shared/api'
import { Button, Sheet, SheetContent } from '@/shared/ui'

import { emptySurvey, surveyAnswers } from '../../lib/survey'
import { newRecords } from '../../model/new-records'
import { EntryResults } from '../entry-results'
import { FinishSummary } from '../finish-summary'
import { NewRecords } from '../new-records'
import { Survey } from '../survey'

// finish.html: summary on the left, the survey on the right from 900px; no app navigation.
export function FinishPage({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const finishing = useSessionStore(selectFinishing)
  const { data: byId, isError: catalogFailed } = useCatalogById()
  const previousWeight = useLastBodyWeight(user.uid)
  const [survey, setSurvey] = useState(emptySurvey)
  const [confirmEmpty, setConfirmEmpty] = useState(false)

  const workout = finishing?.workout
  const entries = useMemo(() => workout?.entries ?? [], [workout])
  const current = useMemo(() => recordsByExercise(entries), [entries])
  const stats = useExerciseStats(user.uid, Object.keys(current))

  // The guard sends the page home once the store is cleared.
  if (!finishing || !workout) return null

  const records = newRecords(current, stats, entries)

  // Writes are fired, never awaited (research R2), so the page leaves at once.
  const save = () => {
    const finished = useSessionStore.getState().finish(surveyAnswers(survey, previousWeight?.kg))
    if (finished) finishWorkout(user.uid, finished.workoutId, finished.workout, byId ?? {})
    void navigate('/')
  }

  const discard = () => {
    useSessionStore.getState().discard()
    discardWorkout(user.uid, finishing.workoutId)
    void navigate('/')
  }

  return (
    <div className="flex flex-col gap-6 pt-2 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-x-16">
      <div className="flex min-w-0 flex-col gap-5">
        <FinishSummary workout={workout} />
        <NewRecords records={records} />
        <EntryResults entries={entries} />
      </div>

      <div className="flex min-w-0 flex-col gap-5 min-[900px]:sticky min-[900px]:top-10">
        <Survey value={survey} onChange={setSurvey} previousWeight={previousWeight} />
        {/* Muscle load is computed from the catalog at save time; a failed load saves without it. */}
        <Button
          size="cta"
          className="w-full"
          disabled={!byId && !catalogFailed}
          onClick={() => (setsDone(entries) === 0 ? setConfirmEmpty(true) : save())}
        >
          Сохранить тренировку
        </Button>
      </div>

      <Sheet open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <SheetContent
          title="Ни одного подхода"
          description="В этой тренировке нет записанных подходов. Удалить её или сохранить как есть?"
        >
          <Button size="cta" className="w-full" onClick={discard}>
            Удалить тренировку
          </Button>
          <Button variant="outline" size="ghost" onClick={save}>
            Сохранить всё равно
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
