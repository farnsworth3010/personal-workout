const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

// The app's one id generator (workouts, entries). crypto.randomUUID needs a secure context, and the
// owner's phone opens the dev server over plain http; getRandomValues works everywhere.
export const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(20)), (byte) => ID_CHARS[byte & 63]).join('')
