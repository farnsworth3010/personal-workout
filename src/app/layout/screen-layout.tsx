import { Outlet } from 'react-router'

// The .screen container of the prototypes.
export function ScreenLayout() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pt-3 pb-6 min-[900px]:gap-7 min-[900px]:px-10 min-[900px]:pt-7 min-[900px]:pb-10">
      <Outlet />
    </main>
  )
}
