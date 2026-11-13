import { isGymOnly, photoUrl, type Exercise } from '@/entities/exercise'
import type { Equipment } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui'

interface ExerciseCardProps {
  name: string
  exercise: Exercise | undefined
  homeEquipment: readonly Equipment[]
  resting: boolean
  // The end-of-movement photo shows on odd seconds.
  alt: boolean
  onDetails: () => void
}

// The exercise photos cross-fading between the start and the end of the movement.
export function ExerciseCard({
  name,
  exercise,
  homeEquipment,
  resting,
  alt,
  onDetails,
}: ExerciseCardProps) {
  return (
    <div
      className={cn(
        'relative flex-1 overflow-hidden rounded-md border border-border bg-surface min-[900px]:flex-[1.2]',
        'animate-in duration-300 fade-in-0',
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
              alt={`${name}: ${photo ? 'конец' : 'начало'} движения`}
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
        onClick={onDetails}
      >
        i
      </button>
    </div>
  )
}
