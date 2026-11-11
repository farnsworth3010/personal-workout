// Ports of one test environment. TEST_PORT_OFFSET=n (0-999) shifts them so agents run tests in parallel;
// 0 keeps firebase.json's ports. Helper ports move to their own ranges: hub 4400+100 would be logging's 4500.
// pnpm dev:remote; its Auth and Firestore ports are the ones opened in the firewall, so offsets avoid them.
export const remotePorts = {
  auth: 9199,
  firestore: 8180,
  websocket: 9160,
  hub: 4410,
  logging: 4510,
}

export function testPorts(value = process.env.TEST_PORT_OFFSET ?? '0') {
  const offset = Number(value)
  if (!Number.isInteger(offset) || offset < 0 || offset > 999)
    throw new Error(`TEST_PORT_OFFSET must be an integer from 0 to 999, got "${value}"`)

  const ports = {
    offset,
    auth: 9099 + offset,
    firestore: 8080 + offset,
    hub: offset ? 29000 + offset : 4400,
    logging: offset ? 30000 + offset : 4500,
    websocket: offset ? 31000 + offset : 9150,
    vite: 5173 + offset,
    preview: 4173 + offset,
  }

  const taken = Object.values(remotePorts)
  const clash = Object.entries(ports).find(
    ([key, port]) => key !== 'offset' && taken.includes(port),
  )
  if (clash)
    throw new Error(
      `TEST_PORT_OFFSET=${value} puts ${clash[0]} on ${String(clash[1])}, a port of pnpm dev:remote; pick another offset`,
    )

  return ports
}

export type TestPorts = ReturnType<typeof testPorts>
