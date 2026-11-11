// Fetches free-exercise-db at a pinned commit into .catalog-cache/ and verifies it (research R1).
// Usage: node scripts/fetch-catalog.ts [--write-manifest]
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CACHE_DIR, MANIFEST_PATH, formatManifest, hashCache, verifyCache } from './lib/manifest.ts'

const REPO = 'https://github.com/yuhonas/free-exercise-db'
const SHA = '79ca7b47d77cd5a6dd7a50440e9f0bf24da6a142'

const git = (...args: string[]) =>
  execFileSync('git', ['-C', CACHE_DIR, ...args], { encoding: 'utf8', stdio: 'pipe' }).trim()

function cachedSha(): string | undefined {
  if (!existsSync(join(CACHE_DIR, '.git'))) return undefined

  try {
    return git('rev-parse', 'HEAD')
  } catch {
    return undefined
  }
}

function fetchDataset() {
  console.log(`Fetching ${REPO} at ${SHA}`)
  mkdirSync(CACHE_DIR, { recursive: true })

  if (!existsSync(join(CACHE_DIR, '.git'))) git('init', '--quiet')

  git('fetch', '--quiet', '--depth', '1', REPO, SHA)
  git('checkout', '--quiet', '--force', 'FETCH_HEAD')
  git('clean', '--quiet', '-ffdx')
}

if (process.argv.includes('--write-manifest')) {
  if (cachedSha() !== SHA) fetchDataset()

  writeFileSync(MANIFEST_PATH, formatManifest(hashCache()))
  console.log(`Wrote ${MANIFEST_PATH}`)
} else {
  let diffs = cachedSha() === SHA ? verifyCache() : ['not fetched']

  if (diffs.length > 0) {
    fetchDataset()
    diffs = verifyCache()
  } else {
    console.log('Catalog cache matches the manifest, network skipped')
  }

  if (diffs.length > 0) {
    console.error(`Catalog cache differs from ${MANIFEST_PATH}:\n${diffs.join('\n')}`)
    process.exit(1)
  }
}
