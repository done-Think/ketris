'use client'

import { Box } from '@mui/material'
import { Suspense } from 'react'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import type { ConsoleShellProps } from '../../types/console.types'
import { ConsoleNav, ConsoleNavWithParams } from './ConsoleNav'
import { consoleNavStyles as styles } from '../../styles/console-nav.styles'

export function ConsoleShell({ children }: ConsoleShellProps) {
  const { tenantId, userId, role } = useTenantSessionScope()
  return (
    <Box
      key={`${tenantId}:${userId}:${role}`}
      sx={styles.shell}
      data-face-check-private="true"
      className="sentry-block"
    >
      <Suspense fallback={<ConsoleNav reviewActive={false} />}>
        <ConsoleNavWithParams />
      </Suspense>
      {children}
    </Box>
  )
}
