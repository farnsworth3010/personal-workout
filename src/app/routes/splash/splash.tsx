// The splash of index.html, kept on screen while the first route module loads.
export function Splash() {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="fixed inset-0 grid place-content-center justify-items-center gap-3.5 bg-background text-center text-[22px] leading-[1.1] font-extrabold tracking-[-0.02em] text-foreground uppercase"
    >
      <img src="/icon.svg" alt="" width={72} height={72} fetchPriority="high" />
      <span>
        Personal
        <br />
        Workout
      </span>
      <i className="h-[3px] w-12 animate-pulse rounded-sm bg-primary motion-reduce:animate-none" />
    </div>
  )
}
