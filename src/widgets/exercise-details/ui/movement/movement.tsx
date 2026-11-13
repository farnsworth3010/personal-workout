import { useEffect, useState } from 'react'

import { photoUrl, type Exercise } from '@/entities/exercise'
import { cn, prefersStill } from '@/shared/lib'
import { ExercisePhoto } from '@/shared/ui'

// The catalog's start and end photos played as a loop, like the session card; a tap shows the
// other position and stops the loop. With motion off it never plays by itself. The box keeps the
// catalog's 3:2 and the whole photo shows, letterboxed when a photo is portrait.
export function Movement({ exercise }: { exercise: Exercise }) {
  const photos = [photoUrl(exercise, 0), photoUrl(exercise, 1)]
  const [end, setEnd] = useState(false)
  const [playing, setPlaying] = useState(() => !prefersStill())
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
      className="relative order-first mb-1.5 aspect-[3/2] max-h-[45dvh] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 focus-ring min-[900px]:max-h-80"
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
