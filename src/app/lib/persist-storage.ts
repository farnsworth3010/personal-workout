// Without it the browser may evict the Firestore cache, and with it unsynced workouts.
export function persistStorage() {
  // navigator.storage exists only in secure contexts, so plain-http demos skip this silently.
  const storage = navigator.storage as StorageManager | undefined

  void storage
    ?.persisted()
    .then((persisted) => persisted || storage.persist())
    .catch(() => undefined)
}
