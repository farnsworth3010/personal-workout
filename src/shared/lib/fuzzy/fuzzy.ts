// fzf-style matching: every query word must appear in order (not necessarily adjacent) inside one field.
const SEPARATOR = /[\s\-_/(),.·:;«»"']/
const WORD_START = 8
const CONSECUTIVE = 5
const MAX_GAP_PENALTY = 3

/** Lower case, ё as е, trimmed: the form both the query and the fields are compared in. */
export const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()

const startsWord = (text: string, i: number) => i === 0 || SEPARATOR.test(text.charAt(i - 1))

/** The best score of `word` as an in-order subsequence of `text`, or null when it is not there. */
export function scoreWord(word: string, text: string): number | null {
  let best: number | null = null

  for (
    let start = text.indexOf(word.charAt(0));
    start !== -1;
    start = text.indexOf(word.charAt(0), start + 1)
  ) {
    let score = 0
    let previous = -1
    let at = start

    for (const char of word) {
      at = text.indexOf(char, at)
      if (at === -1) break

      score += 1
      if (startsWord(text, at)) score += WORD_START
      if (previous !== -1 && at === previous + 1) score += CONSECUTIVE
      if (previous !== -1) score -= Math.min(at - previous - 1, MAX_GAP_PENALTY)
      previous = at
      at += 1
    }

    if (at !== -1 && (best === null || score > best)) best = score
  }

  return best
}

/** The sum of each query word's best score over the fields, or null when a word matches none. */
export function fuzzyScore(query: string, fields: readonly string[]): number | null {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  const texts = fields.map(normalize)
  let total = 0

  for (const word of words) {
    let best: number | null = null

    for (const text of texts) {
      const score = scoreWord(word, text)
      if (score !== null && (best === null || score > best)) best = score
    }
    if (best === null) return null

    total += best
  }

  return total
}

/** Items matching every query word, best first; an empty query keeps all in their order. */
export function fuzzyFilter<T>(
  items: readonly T[],
  query: string,
  fieldsOf: (item: T) => readonly string[],
): T[] {
  if (!normalize(query)) return [...items]

  return items
    .map((item, index) => ({ item, index, score: fuzzyScore(query, fieldsOf(item)) }))
    .filter((hit): hit is { item: T; index: number; score: number } => hit.score !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((hit) => hit.item)
}
