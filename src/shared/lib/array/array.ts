/** The list with the item at index swapped by delta places; an out-of-range move returns the same array. */
export function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return list

  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]

  return next
}
