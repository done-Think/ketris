'use client'

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Stack } from '@mui/material'

import {
  DashboardHeaderActionButton,
  DashboardMonthSelector,
  DashboardNotificationsButton,
} from '@shared/components/layout'
import { iconSize } from '@shared/theme/tokens'

export interface FinancialDashboardHeaderActionsProps {
  exportLabel: string
}

export function FinancialDashboardHeaderActions({
  exportLabel,
}: FinancialDashboardHeaderActionsProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}
    >
      <DashboardMonthSelector />
      <DashboardHeaderActionButton
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
      >
        {exportLabel}
      </DashboardHeaderActionButton>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )
}
