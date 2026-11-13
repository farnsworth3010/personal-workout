export {
  completeRedirectSignIn,
  onAuthError,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  type AuthUser,
} from './auth'
export { db } from './firebase'
export { createQueryClient, docSource, querySource, useSnapshotQuery, type WithId } from './query'
export * from './schema'
export { fireWrite, onWriteError } from './write'
