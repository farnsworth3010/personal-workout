// Path end points (M, L and the last pair of C); every path uses absolute M, L, C and Z only.
function endPoints(d: string) {
  return [...d.matchAll(/([MLC])([^MLCZ]*)/g)].flatMap(([, , args = '']) => {
    const n = args
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    const x = n.at(-2)
    const y = n.at(-1)
    return x === undefined || y === undefined ? [] : [{ x, y }]
  })
}

/**
 * Vertical span [top, bottom] of a muscle's shapes that reach the midline (x ≥ 98.5), or null.
 * The two mirrored halves leave a gap there that a tap would fall through.
 */
export function midlineSpan(paths: string[]): [number, number] | null {
  const ys = paths.flatMap(endPoints).flatMap((p) => (p.x >= 98.5 ? [p.y] : []))
  return ys.length === 0 ? null : [Math.min(...ys), Math.max(...ys)]
}
