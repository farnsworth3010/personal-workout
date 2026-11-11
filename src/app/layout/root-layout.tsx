import { Outlet, ScrollRestoration } from 'react-router'

import { onWriteError } from '@/shared/api'
import { SyncNotice, Toaster } from '@/shared/ui'

import { AuthProvider } from './auth-provider'
import { MotionPreference } from './motion-preference'
import { OfflineStrip } from './offline-strip'
import { PwaUpdate } from './pwa-update'
import { QueryProvider } from './query-provider'

export function RootLayout() {
  return (
    <QueryProvider>
      {/* A new navigation starts at the top; back and forward restore the position. */}
      <ScrollRestoration />
      <OfflineStrip />
      <AuthProvider>
        <MotionPreference />
        {/* Clear of Safari's top bar on phones (viewport-fit=cover); the offline strip pads the inset itself. */}
        <div className="max-[900px]:pt-[max(env(safe-area-inset-top),12px)] max-[900px]:[[data-offline-strip]+&]:pt-0">
          <Outlet />
        </div>
        <PwaUpdate />
      </AuthProvider>
      <Toaster />
      <SyncNotice subscribe={onWriteError} />
    </QueryProvider>
  )
}
