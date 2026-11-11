import { testPorts } from '../../scripts/lib/test-ports.ts'

// The emulators of this run; TEST_PORT_OFFSET shifts them (scripts/test-env.ts).
export const ports = testPorts()
export const projectId = 'demo-workout'
export const authEmulator = `http://127.0.0.1:${String(ports.auth)}`
export const firestoreEmulator = `http://127.0.0.1:${String(ports.firestore)}`
// REST base for owner reads in specs: fetch(`${firestoreDocuments}/users/${uid}`, { headers: { Authorization: 'Bearer owner' } })
export const firestoreDocuments = `${firestoreEmulator}/v1/projects/${projectId}/databases/(default)/documents`
