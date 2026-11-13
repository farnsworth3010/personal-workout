import { Outlet } from 'react-router'

import { NavFrame } from '../nav-frame'

export function NavLayout() {
  return (
    <NavFrame>
      <Outlet />
    </NavFrame>
  )
}
