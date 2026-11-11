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
        {/* Below Safari's top bar and its blur, which reaches past the inset; the offline strip pads it itself. */}
        <div className="max-[900px]:pt-[calc(env(safe-area-inset-top)+16px)] max-[900px]:[[data-offline-strip]+&]:pt-0">
          <Outlet />
        </div>
        <PwaUpdate />
      </AuthProvider>
      <Toaster />
      <SyncNotice subscribe={onWriteError} />
    </QueryProvider>
  )
}
