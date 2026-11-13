import { Outlet, ScrollRestoration } from 'react-router'

import { onWriteError } from '@/shared/api'
import { SyncNotice, Toaster } from '@/shared/ui'

import { AuthProvider } from '../auth-provider'
import { MotionPreference } from '../motion-preference'
import { OfflineStrip } from '../offline-strip'
import { PwaUpdate } from '../pwa-update'
import { QueryProvider } from '../query-provider'
import { TopInset } from '../top-inset'

export function RootLayout() {
  return (
    <QueryProvider>
      {/* A new navigation starts at the top; back and forward restore the position. */}
      <ScrollRestoration />
      <OfflineStrip />
      <AuthProvider>
        <MotionPreference />
        <TopInset>
          <Outlet />
        </TopInset>
        <PwaUpdate />
      </AuthProvider>
      <Toaster />
      <SyncNotice subscribe={onWriteError} />
    </QueryProvider>
  )
}
