import { useEffect, useState, type ReactNode } from 'react'

import {
  equipmentLabels,
  isGymOnly,
  kindLabels,
  muscleLabels,
  photoUrl,
  useExercise,
  type Equipment,
  type Exercise,
} from '@/entities/exercise'
import { cn } from '@/shared/lib'
import { Badge, ExercisePhoto, Sheet, SheetContent } from '@/shared/ui'

const lower = (text: string) => text.toLocaleLowerCase('ru')

const muscles = (exercise: Exercise) =>
  [exercise.primaryMuscles, exercise.secondaryMuscles]
    .filter((group) => group.length > 0)
    .map((group) => group.map((m) => lower(muscleLabels[m])).join(', '))
    .join(' · ')

function Title({
  exercise,
  homeEquipment,
}: {
  exercise: Exercise
  homeEquipment: readonly Equipment[]
}) {
  return (
    <>
      {exercise.name}
      {isGymOnly(exercise, homeEquipment) && <Badge className="ml-1.5 align-[3px]">зал</Badge>}
    </>
  )
}

// The profile's animations switch (app/layout/motion-preference) or the system setting.
const still = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.hasAttribute('data-motion-off')

// The catalog's start and end photos played as a loop, like the session card; a tap shows the
// other position and stops the loop. With motion off it never plays by itself. The box keeps the
// catalog's 3:2 and the whole photo shows, letterboxed when a photo is portrait.
function Movement({ exercise }: { exercise: Exercise }) {
  const photos = [photoUrl(exercise, 0), photoUrl(exercise, 1)]
  const [end, setEnd] = useState(false)
  const [playing, setPlaying] = useState(() => !still())
  const canPlay = playing && photos[1] !== undefined

  useEffect(() => {
    if (!canPlay) return

    const timer = setInterval(() => setEnd((e) => !e), 1000)
    return () => clearInterval(timer)
  }, [canPlay])

  return (
    <button
      type="button"
      aria-label={end ? 'Показать начало движения' : 'Показать конец движения'}
      className="relative order-first mb-1.5 aspect-[3/2] max-h-[45dvh] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid min-[900px]:max-h-80"
      onClick={() => {
        setPlaying(false)
        setEnd((e) => !e)
      }}
    >
      {photos.map(
        (src, n) =>
          src && (
            <ExercisePhoto
              key={src}
              src={src}
              alt={`${exercise.name}: ${n === 0 ? 'начало' : 'конец'} движения`}
              className={cn(
                'absolute inset-0 size-full object-contain transition-opacity duration-250',
                n === 1 && !end && 'opacity-0',
              )}
            />
          ),
      )}
    </button>
  )
}

// The body of exercises.html's description: the movement, muscles, equipment, technique steps.
function Body({ exercise }: { exercise: Exercise }) {
  return (
    <>
      <Movement exercise={exercise} />
      <p className="text-sm leading-[1.4]">
        <span className="text-muted-foreground">Мышцы:</span> {muscles(exercise)}
      </p>
      <p className="text-sm leading-[1.4]">
        <span className="text-muted-foreground">Оборудование:</span>{' '}
        {lower(equipmentLabels[exercise.equipment ?? 'body only'])} · {kindLabels[exercise.kind]}
      </p>
      <ol className="mt-1.5 flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[1.4]">
        {exercise.instructions.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </>
  )
}

interface DetailsProps {
  exerciseId: string
  homeEquipment: readonly Equipment[]
  // An action after the steps, such as "Добавить в набор".
  children?: ReactNode
}

// A bottom sheet on phones and a centred dialog from 900px (SheetContent does both).
export function ExerciseDetails({
  exerciseId,
  homeEquipment,
  open,
  onOpenChange,
  children,
}: DetailsProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: exercise } = useExercise(exerciseId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={
          exercise ? <Title exercise={exercise} homeEquipment={homeEquipment} /> : 'Упражнение'
        }
        className="gap-2"
      >
        {exercise ? (
          <>
            <Body exercise={exercise} />
            {children}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

// The desktop side panel of the catalog and the session.
export function ExerciseDetailsPanel({ exerciseId, homeEquipment, children }: DetailsProps) {
  const { data: exercise } = useExercise(exerciseId)

  return (
    <section
      aria-label="Описание упражнения"
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-6"
    >
      {exercise ? (
        <>
          <h2 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] uppercase">
            <Title exercise={exercise} homeEquipment={homeEquipment} />
          </h2>
          <Body exercise={exercise} />
          {children}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      )}
    </section>
  )
}
