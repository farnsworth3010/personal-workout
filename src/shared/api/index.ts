export {
  completeRedirectSignIn,
  onAuthError,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  type AuthErrorListener,
  type AuthUser,
} from './auth'
export { app, auth, db } from './firebase'
export {
  createQueryClient,
  docSource,
  querySource,
  subscribeQuery,
  useSnapshotQuery,
  type SnapshotSource,
  type WithId,
} from './query'
export * from './schema'
export { fireWrite, onWriteError, type WriteErrorListener, type WriteLabel } from './write'
