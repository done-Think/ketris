'use client'

import { Box, Skeleton } from '@mui/material'
import { Suspense } from 'react'

import { CapturePage } from './capture/CapturePage'
import { ConsoleShell } from './console/ConsoleShell'
import { SessionDetailPage } from './console/detail/SessionDetailPage'
import { OverviewPage } from './console/overview/OverviewPage'
import { SessionsPage } from './console/sessions/SessionsPage'
import { SettingsPage } from './console/settings/SettingsPage'

export function FaceCheckOverviewPage() {
  return (
    <ConsoleShell>
      <OverviewPage />
    </ConsoleShell>
  )
}
export function FaceCheckSessionsPage() {
  return (
    <ConsoleShell>
      <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
        <SessionsPage />
      </Suspense>
    </ConsoleShell>
  )
}
export function FaceCheckSessionDetailPage({ id }: { id: string }) {
  return (
    <ConsoleShell>
      <SessionDetailPage id={id} />
    </ConsoleShell>
  )
}
export function FaceCheckSettingsPage() {
  return (
    <ConsoleShell>
      <SettingsPage />
    </ConsoleShell>
  )
}
export function FaceCheckCapturePage({ token }: { token: string }) {
  return (
    <Box data-face-check-private>
      <CapturePage token={token} />
    </Box>
  )
}
