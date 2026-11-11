export type Signal = 'set-done' | 'rest-end' | 'countdown-end' | 'workout-done'

// [frequency Hz, start s, length s] per tone; each signal has its own rhythm, so they are told apart.
const TONES: Record<Signal, [number, number, number][]> = {
  'set-done': [[880, 0, 0.12]],
  'rest-end': [
    [988, 0, 0.15],
    [988, 0.22, 0.15],
    [988, 0.44, 0.3],
  ],
  'countdown-end': [[660, 0, 0.6]],
  'workout-done': [
    [523, 0, 0.16],
    [659, 0.16, 0.16],
    [784, 0.32, 0.16],
    [1047, 0.48, 0.45],
  ],
}

const VOLUME = 0.3

let context: AudioContext | undefined

// Browsers start a context suspended until a tap; call this from a tap handler.
export function unlockAudio() {
  if (!('AudioContext' in window)) return

  try {
    context ??= new AudioContext()

    if (context.state !== 'running') void context.resume().catch(() => undefined)
  } catch {
    // No audio device or the browser refused: the workout goes on silently.
  }
}

// Skipped unless a tap has unlocked the context and it still runs (research R5).
export function playSignal(signal: Signal) {
  if (context?.state !== 'running') return

  const ctx = context

  for (const [frequency, start, length] of TONES[signal]) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const at = ctx.currentTime + start

    oscillator.frequency.value = frequency
    // A short attack and decay avoid clicks at the edges of each tone.
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(VOLUME, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(at)
    oscillator.stop(at + length + 0.02)
  }
}
