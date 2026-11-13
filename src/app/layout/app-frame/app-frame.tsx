import { createElement } from 'react'
import { useLocation } from 'react-router'

import { skeletonFor } from '../../routes/skeletons'
import { NavFrame } from '../nav-frame'
import { ScreenFrame } from '../screen-frame'
import { TopInset } from '../top-inset'

// Presentational, no providers: stands in for RootLayout > NavLayout > ScreenLayout while the real
// tree is still loading, for a returning user whose last-user snapshot lets BootFallback use it (3.4).
export function AppFrame() {
  const { pathname } = useLocation()
  const Skeleton = skeletonFor(pathname)
  const screen = <ScreenFrame>{Skeleton && createElement(Skeleton)}</ScreenFrame>

  return (
    <TopInset>{pathname.startsWith('/session') ? screen : <NavFrame>{screen}</NavFrame>}</TopInset>
  )
}
