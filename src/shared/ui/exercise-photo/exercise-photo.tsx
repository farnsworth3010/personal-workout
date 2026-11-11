import { useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { ImageOff } from 'lucide-react'

// Offline, a photo never viewed before fails to load: show a neutral tile of the same size instead.
function ExercisePhoto({ src, alt = '', className, onLoad, ...props }: ComponentProps<'img'>) {
  const [failed, setFailed] = useState<string>()
  const [loaded, setLoaded] = useState<string>()

  if (!src || failed === src) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        data-slot="exercise-photo"
        className={cn(
          '@container flex flex-col items-center justify-center gap-1 bg-surface-2 text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-1/3 max-h-8 max-w-8" />
        {/* Thumbnails are too small for words; the icon alone says it there. */}
        <span aria-hidden="true" className="hidden text-xs @min-[8rem]:block">
          Нет фото
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      data-slot="exercise-photo"
      className={cn('bg-surface-2', loaded !== src && 'motion-safe:animate-pulse', className)}
      onLoad={(event) => {
        setLoaded(src)
        onLoad?.(event)
      }}
      onError={() => setFailed(src)}
      {...props}
    />
  )
}

export { ExercisePhoto }
