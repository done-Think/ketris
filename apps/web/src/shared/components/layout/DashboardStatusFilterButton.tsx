import { Box, Button, type ButtonProps } from '@mui/material'
import type { ReactNode } from 'react'

import {
  dashboardStatusFilterButtonSx,
  dashboardStatusFilterCountSx,
  dashboardStatusFilterToneSx,
} from './dashboard-header-actions'

type DashboardStatusFilterButtonProps = {
  active: boolean
  count: number
  children: ReactNode
  onClick: () => void
  sx?: ButtonProps['sx']
}

export function DashboardStatusFilterButton({
  active,
  count,
  children,
  onClick,
  sx,
}: DashboardStatusFilterButtonProps) {
  return (
    <Button
      type="button"
      variant="text"
      aria-pressed={active}
      onClick={onClick}
      sx={[
        dashboardStatusFilterButtonSx,
        dashboardStatusFilterToneSx(active),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
      <Box component="span" sx={dashboardStatusFilterCountSx(active)}>
        {count}
      </Box>
    </Button>
  )
}
