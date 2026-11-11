export type WriteErrorListener = (error: unknown) => void

const listeners = new Set<WriteErrorListener>()

export function onWriteError(listener: WriteErrorListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function report(error: unknown) {
  if (listeners.size === 0) console.error('Firestore write failed', error)
  for (const listener of listeners) listener(error)
}

// The write promise settles only on server ack, which never comes offline (constitution III).
export function fireWrite(write: () => Promise<unknown>): void {
  try {
    write().catch(report)
  } catch (error) {
    report(error)
  }
}
