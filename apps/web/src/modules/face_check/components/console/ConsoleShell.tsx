'use client'

import { Box } from '@mui/material'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import type { ConsoleShellProps } from '../../types/console.types'
import { consoleShellStyles as styles } from '../../styles/console-shell.styles'

export function ConsoleShell({ children }: ConsoleShellProps) {
  const { tenantId, userId, role } = useTenantSessionScope()
  return (
    <Box
      key={`${tenantId}:${userId}:${role}`}
      sx={styles.shell}
      data-face-check-private="true"
      className="sentry-block"
    >
      {children}
    </Box>
  )
}
