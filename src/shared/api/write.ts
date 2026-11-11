// What a failed write was about, so the notice can name it; 'other' when the caller does not say.
export type WriteLabel = 'workout' | 'finish' | 'stats' | 'profile' | 'template' | 'reset' | 'other'

export type WriteErrorListener = (error: unknown, label: WriteLabel) => void

const listeners = new Set<WriteErrorListener>()

export function onWriteError(listener: WriteErrorListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function report(error: unknown, label: WriteLabel) {
  if (listeners.size === 0) console.error(`Firestore write failed (${label})`, error)
  for (const listener of listeners) listener(error, label)
}

// The write promise settles only on server ack, which never comes offline (constitution III).
export function fireWrite(write: () => Promise<unknown>, label: WriteLabel = 'other'): void {
  try {
    write().catch((error: unknown) => {
      report(error, label)
    })
  } catch (error) {
    report(error, label)
  }
}
