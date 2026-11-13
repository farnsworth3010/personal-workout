import { midlineSpan } from '../../lib/midline'

// Invisible hit area over the midline gap between a muscle's mirrored halves.
export function MidlineBridge({ paths }: { paths: string[] }) {
  const span = midlineSpan(paths)
  if (!span) return null

  return (
    <rect
      data-hit="midline"
      x={98}
      y={span[0]}
      width={4}
      height={span[1] - span[0]}
      className="fill-transparent stroke-none"
    />
  )
}
