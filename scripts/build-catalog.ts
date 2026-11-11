// Builds public/catalog/ from the verified dataset cache (research R1, R11).
// Usage: node scripts/build-catalog.ts (after scripts/fetch-catalog.ts)
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { toExercise, type Override, type RawExercise } from './lib/derive.ts'
import { CACHE_DIR, ROOT, verifyCache } from './lib/manifest.ts'

const OUT_DIR = join(ROOT, 'public', 'catalog')
const IMAGES_DIR = join(OUT_DIR, 'images')

const diffs = verifyCache()

if (diffs.length > 0) {
  console.error(`Catalog cache is not verified, run fetch-catalog first:\n${diffs.join('\n')}`)
  process.exit(1)
}

const raw = JSON.parse(
  readFileSync(join(CACHE_DIR, 'dist', 'exercises.json'), 'utf8'),
) as RawExercise[]
const overrides = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'catalog-overrides.json'), 'utf8'),
) as Record<string, Override>

const ids = new Set(raw.map((exercise) => exercise.id))
const unknown = Object.keys(overrides).filter((id) => !ids.has(id))

if (unknown.length > 0) {
  console.error(`Overrides for unknown exercises: ${unknown.join(', ')}`)
  process.exit(1)
}

// Ids become directory names; the dataset is hash-pinned, this guards a future upgrade.
const unsafe = raw.filter((exercise) => !/^[\w-]+$/.test(exercise.id))

if (unsafe.length > 0) {
  console.error(`Unsafe exercise ids: ${unsafe.map((exercise) => exercise.id).join(', ')}`)
  process.exit(1)
}

rmSync(IMAGES_DIR, { recursive: true, force: true })

const catalog = raw.map((source) => {
  const exercise = toExercise(source, overrides[source.id])

  for (const [n, image] of exercise.images.entries()) {
    const target = join(IMAGES_DIR, image)

    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(CACHE_DIR, 'exercises', source.images[n] ?? ''), target)
  }

  return exercise
})

// Technique steps are most of the bytes and only the details sheet reads them, so they load apart.
const steps: Record<string, string[]> = {}
const list = catalog.map(({ instructions, ...exercise }) => {
  steps[exercise.id] = instructions

  return exercise
})

writeFileSync(join(OUT_DIR, 'exercises.json'), JSON.stringify(list))
writeFileSync(join(OUT_DIR, 'instructions.json'), JSON.stringify(steps))
console.log(`Built ${catalog.length} exercises into ${OUT_DIR}`)
