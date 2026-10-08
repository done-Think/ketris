import { Box, Button } from '@mui/material'

import {
  dashboardStatusFilterButtonSx,
  dashboardStatusFilterCountSx,
  dashboardStatusFilterToneSx,
} from './dashboard-header-actions'
import type { DashboardStatusFilterButtonProps } from '@shared/types/dashboard-status-filter-button'

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
