/** The editor URL that appends the exercise to the set, or to a new one. */
export const addToSetUrl = (templateId: string | null, exerciseId: string) =>
  `/templates/${templateId ?? 'new'}?${new URLSearchParams({ add: exerciseId })}`
