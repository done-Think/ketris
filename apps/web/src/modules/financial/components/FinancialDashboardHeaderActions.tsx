'use client'

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import {
  DashboardHeaderActionButton,
  DashboardMonthSelector,
  DashboardNotificationsButton,
} from '@shared/components/layout'

import { styles } from '../styles/financial-dashboard-header-actions.styles'
import type { FinancialDashboardHeaderActionsProps } from '../types/financial-entry'

export function FinancialDashboardHeaderActions({
  month,
  months,
  exporting,
  onMonthChange,
  onExport,
}: FinancialDashboardHeaderActionsProps) {
  const t = useTranslations('dashboard.finance')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={styles.actions}>
      <DashboardMonthSelector value={month} options={months} onChange={onMonthChange} />
      <DashboardHeaderActionButton
        startIcon={<FileDownloadOutlinedIcon sx={styles.icon} />}
        onClick={onExport}
        disabled={exporting}
      >
        {t('export')}
      </DashboardHeaderActionButton>
      <Box sx={styles.desktopOnly}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )
}
