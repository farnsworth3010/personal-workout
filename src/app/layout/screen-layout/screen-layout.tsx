import { createElement } from 'react'
import { Outlet } from 'react-router'

import { useRouteSkeleton } from '../../model/use-route-skeleton'
import { ScreenFrame } from '../screen-frame'

export function ScreenLayout() {
  const Skeleton = useRouteSkeleton()

  return <ScreenFrame>{Skeleton ? createElement(Skeleton) : <Outlet />}</ScreenFrame>
}
