import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runGroup } from './run-group.ts'

const exists = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// A killed process lingers until its new parent reaps it, so give it a second.
async function alive(pid: number) {
  for (let i = 0; i < 50 && exists(pid); i++) await new Promise((r) => setTimeout(r, 20))
  return exists(pid)
}

// A command that leaves a background process behind, like emulators:exec leaving Vite or a JVM.
function leaver(tail: string) {
  const file = join(mkdtempSync(join(tmpdir(), 'run-group-')), 'pid')
  const group = runGroup('sh', ['-c', `sleep 300 & echo $! > ${file}; ${tail}`], process.env)
  const leftover = async () => {
    for (let i = 0; i < 50 && !readFileSync(file, { flag: 'a+' }).length; i++)
      await new Promise((resolve) => setTimeout(resolve, 20))
    return Number(readFileSync(file, 'utf8'))
  }

  return { ...group, leftover }
}

describe('runGroup', () => {
  it('kills what the command left behind when it exits, with its exit code', async () => {
    const { done, leftover } = leaver('exit 3')
    const pid = await leftover()

    expect(await done).toBe(3)
    expect(await alive(pid)).toBe(false)
  })

  it('stops the whole group on stop()', async () => {
    const { done, stop, leftover } = leaver('wait')
    const pid = await leftover()
    expect(exists(pid)).toBe(true)

    stop()
    await done

    expect(await alive(pid)).toBe(false)
  })
})
