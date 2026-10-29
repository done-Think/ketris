import { Paper } from '@mui/material'

import type { DashboardPanelProps } from '@shared/types/dashboard-panel'

export function DashboardPanel({ children }: DashboardPanelProps) {
  return <Paper variant="dashboard">{children}</Paper>
}
