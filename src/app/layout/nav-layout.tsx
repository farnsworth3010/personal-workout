import { Outlet } from 'react-router'

import { AppNav } from '@/widgets/app-nav'

// The padding keeps content clear of the bottom bar on phones and the 220px sidebar from 900px.
export function NavLayout() {
  return (
    <>
      <AppNav />
      <div className="pb-[calc(56px+env(safe-area-inset-bottom))] min-[900px]:pb-0 min-[900px]:pl-[220px]">
        <Outlet />
      </div>
    </>
  )
}
