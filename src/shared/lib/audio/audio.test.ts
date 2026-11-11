import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Records what each signal schedules; the state is what the browser reports.
class FakeContext {
  static instances: FakeContext[] = []
  state: AudioContextState = 'suspended'
  currentTime = 10
  destination = {}
  tones: { frequency: number; start: number }[] = []
  resume = vi.fn(() => {
    this.state = 'running'

    return Promise.resolve()
  })

  constructor() {
    FakeContext.instances.push(this)
  }

  createGain() {
    const param = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }

    return { gain: param, connect: (node: unknown) => node }
  }

  createOscillator() {
    const tone = { frequency: 0, start: 0 }
    this.tones.push(tone)

    return {
      frequency: {
        set value(v: number) {
          tone.frequency = v
        },
      },
      connect: (node: unknown) => node,
      start: (at: number) => (tone.start = at),
      stop: vi.fn(),
    }
  }
}

const load = async () => {
  vi.resetModules()

  return import('./audio')
}

beforeEach(() => {
  FakeContext.instances = []
  vi.stubGlobal('window', { AudioContext: FakeContext })
  vi.stubGlobal('AudioContext', FakeContext)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('audio', () => {
  it('stays silent until a tap unlocks the context', async () => {
    const { playSignal } = await load()

    playSignal('set-done')

    expect(FakeContext.instances).toHaveLength(0)
  })

  it('creates one context on the first tap and resumes it', async () => {
    const { unlockAudio } = await load()

    unlockAudio()
    unlockAudio()

    expect(FakeContext.instances).toHaveLength(1)
    expect(FakeContext.instances[0]?.resume).toHaveBeenCalledOnce()
  })

  it('plays four distinct signals once unlocked', async () => {
    const { playSignal, unlockAudio } = await load()

    unlockAudio()
    await Promise.resolve()

    const context = FakeContext.instances[0]
    const shapes = (['set-done', 'rest-end', 'countdown-end', 'workout-done'] as const).map(
      (signal) => {
        context.tones = []
        playSignal(signal)

        return JSON.stringify(context.tones)
      },
    )

    expect(new Set(shapes).size).toBe(4)
    expect(shapes.every((shape) => shape !== '[]')).toBe(true)
  })

  it('skips a signal while the context is not running', async () => {
    const { playSignal, unlockAudio } = await load()

    unlockAudio()
    await Promise.resolve()

    const context = FakeContext.instances[0]
    context.state = 'interrupted'
    playSignal('rest-end')

    expect(context.tones).toHaveLength(0)
  })

  it('does nothing where Web Audio is missing', async () => {
    vi.stubGlobal('window', {})
    const { playSignal, unlockAudio } = await load()

    expect(() => {
      unlockAudio()
      playSignal('set-done')
    }).not.toThrow()
  })
})
