import { describe, expect, it } from 'vitest'

import { testPorts } from './test-ports.ts'

describe('testPorts', () => {
  it('keeps the ports of firebase.json and playwright.config.ts at offset 0', () => {
    expect(testPorts('0')).toEqual({
      offset: 0,
      auth: 9099,
      firestore: 8080,
      hub: 4400,
      logging: 4500,
      websocket: 9150,
      vite: 5173,
      preview: 4173,
    })
  })

  it('gives every assigned offset its own ports', () => {
    const all = [0, 200, 300, 400, 500, 600, 700, 800, 900].flatMap((n) =>
      Object.entries(testPorts(String(n)))
        .filter(([key]) => key !== 'offset')
        .map(([, port]) => port),
    )

    expect(new Set(all).size).toBe(all.length)
  })

  it('rejects the offsets that would land on a port of pnpm dev:remote', () => {
    expect(() => testPorts('100')).toThrow('dev:remote')
    expect(() => testPorts('61')).toThrow('dev:remote')
    expect(() => testPorts('900')).not.toThrow()
  })

  it('rejects an offset outside 0-999', () => {
    for (const bad of ['-1', '1000', '1.5', 'abc']) expect(() => testPorts(bad)).toThrow(bad)
  })
})
