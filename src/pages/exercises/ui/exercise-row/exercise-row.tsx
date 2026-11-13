import {
  equipmentLabels,
  kindLabels,
  muscleLine,
  photoUrl,
  type Exercise,
} from '@/entities/exercise'
import { Badge } from '@/shared/ui'

interface ExerciseRowProps {
  exercise: Exercise
  gym: boolean
  current: boolean
  onOpen: (id: string) => void
}

export function ExerciseRow({ exercise, gym, current, onOpen }: ExerciseRowProps) {
  const photo = photoUrl(exercise, 0)

  return (
    <li className="border-b border-border">
      <button
        type="button"
        aria-current={current}
        className="relative grid w-full grid-cols-[64px_minmax(0,1fr)] items-center gap-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:before:absolute aria-[current=true]:before:inset-y-2.5 aria-[current=true]:before:-left-3 aria-[current=true]:before:w-0.5 aria-[current=true]:before:bg-primary aria-[current=true]:before:content-[''] min-[900px]:rounded-lg min-[900px]:px-3 min-[900px]:hover:bg-surface min-[900px]:aria-[current=true]:bg-surface min-[900px]:aria-[current=true]:before:left-0"
        onClick={() => onOpen(exercise.id)}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="size-16 rounded-lg bg-surface object-cover"
          />
        ) : (
          <span aria-hidden="true" className="size-16 rounded-lg bg-surface" />
        )}
        <span className="min-w-0">
          <b className="block text-base leading-tight font-semibold">
            {exercise.name}
            {gym && <Badge className="ml-1.5 align-[1px]">зал</Badge>}
          </b>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {muscleLine(exercise)}
          </span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {equipmentLabels[exercise.equipment ?? 'body only']} · {kindLabels[exercise.kind]}
          </span>
        </span>
      </button>
    </li>
  )
}
