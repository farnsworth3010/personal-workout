import { describe, expect, it } from 'vitest'

import { auth, db } from './firebase'

describe('firebase (jsdom)', () => {
  it('initializes against the emulators with the demo project', () => {
    expect(db.app.options.projectId).toBe('demo-workout')
    expect(auth.emulatorConfig).toMatchObject({ host: '127.0.0.1', port: 9099 })
  })
})
