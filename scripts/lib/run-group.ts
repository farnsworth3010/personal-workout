import { spawn } from 'node:child_process'

const KILL_AFTER_MS = 8000

// Signals the whole group; it may already be gone.
function signalGroup(pid: number, signal: NodeJS.Signals) {
  try {
    process.kill(-pid, signal)
  } catch {
    // ESRCH: nothing left in the group.
  }
}

// Runs a command in its own process group. stop() sends SIGINT and SIGKILL after 8 s; when the
// command exits, whatever it left in the group (Vite under emulators:exec, an emulator JVM) is killed.
export function runGroup(command: string, args: string[], env: NodeJS.ProcessEnv) {
  const child = spawn(command, args, { stdio: 'inherit', detached: true, env })
  const pid = child.pid ?? 0

  const done = new Promise<number>((resolve) => {
    child.on('exit', (code, signal) => {
      signalGroup(pid, 'SIGKILL')
      resolve(code ?? (signal ? 1 : 0))
    })
  })

  let stopping = false
  const stop = () => {
    if (stopping) return
    stopping = true
    signalGroup(pid, 'SIGINT')
    setTimeout(() => {
      signalGroup(pid, 'SIGKILL')
    }, KILL_AFTER_MS).unref()
  }

  return { done, stop }
}

// For scripts: stops the group once on SIGINT, SIGTERM or SIGHUP and exits with the command's code.
export function runInGroup(command: string, args: string[], env: NodeJS.ProcessEnv): void {
  const { done, stop } = runGroup(command, args, env)

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  process.on('SIGHUP', stop)

  void done.then((code) => process.exit(code))
}
