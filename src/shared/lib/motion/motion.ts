// The profile's animations switch (app/layout/motion-preference) or the system setting.
export const prefersStill = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.hasAttribute('data-motion-off')
