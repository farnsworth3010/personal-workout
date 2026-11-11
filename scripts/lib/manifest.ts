import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export const ROOT = join(import.meta.dirname, '..', '..')
export const CACHE_DIR = join(ROOT, '.catalog-cache')
export const MANIFEST_PATH = join(ROOT, 'scripts', 'catalog-manifest.sha256')

// The only dataset files the build reads.
const COVERED = ['exercises', join('dist', 'exercises.json')]

export function hashCache(): Map<string, string> {
  const hashes = new Map<string, string>()

  for (const entry of COVERED) {
    const full = join(CACHE_DIR, entry)

    if (!existsSync(full)) continue

    const files = entry.endsWith('.json')
      ? [full]
      : readdirSync(full, { recursive: true, withFileTypes: true })
          .filter((dirent) => dirent.isFile())
          .map((dirent) => join(dirent.parentPath, dirent.name))

    for (const file of files) {
      const hash = createHash('sha256').update(readFileSync(file)).digest('hex')

      hashes.set(relative(CACHE_DIR, file).split(sep).join('/'), hash)
    }
  }

  return hashes
}

/** sha256sum format, sorted by path, so `sha256sum -c` works inside the cache too. */
export function formatManifest(hashes: Map<string, string>): string {
  return [...hashes]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, hash]) => `${hash}  ${path}\n`)
    .join('')
}

export function parseManifest(text: string): Map<string, string> {
  const hashes = new Map<string, string>()

  for (const line of text.split('\n')) {
    if (line === '') continue

    const match = /^([0-9a-f]{64}) {2}(.+)$/.exec(line)

    if (!match) throw new Error(`Bad manifest line: ${line}`)

    hashes.set(match[2], match[1])
  }

  return hashes
}

export function diffManifest(expected: Map<string, string>, actual: Map<string, string>): string[] {
  const diffs: string[] = []

  for (const [path, hash] of expected) {
    const got = actual.get(path)

    if (got === undefined) diffs.push(`missing  ${path}`)
    else if (got !== hash) diffs.push(`mismatch ${path}`)
  }

  for (const path of actual.keys()) {
    if (!expected.has(path)) diffs.push(`extra    ${path}`)
  }

  return diffs
}

export function verifyCache(): string[] {
  return diffManifest(parseManifest(readFileSync(MANIFEST_PATH, 'utf8')), hashCache())
}
