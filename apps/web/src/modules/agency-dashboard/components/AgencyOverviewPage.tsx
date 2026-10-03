'use client'

import { useMemo } from 'react'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import {
  DashboardHeaderActionButton,
  DashboardMonthSelector,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { iconSize, surface } from '@shared/theme/tokens'

import { useAgencyOverview } from '../hooks/use-agency-dashboard'
import { mapAgencyOverviewToUi } from '../utils/agency-overview-adapter'
import { AgencyOverviewKpiGrid } from './AgencyOverviewKpiGrid'
import { AgencyRecentActivityPanel } from './AgencyRecentActivityPanel'
import { AgencyRevenuePerformancePanel } from './AgencyRevenuePerformancePanel'
import { AgencyTopBrokersPanel } from './AgencyTopBrokersPanel'

export function AgencyOverviewPage() {
  const t = useTranslations('dashboard.agencyOverview')
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const overviewQuery = useAgencyOverview(tenantId)
  const overview = useMemo(
    () => (overviewQuery.data ? mapAgencyOverviewToUi(overviewQuery.data) : null),
    [overviewQuery.data],
  )

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { sm: 'center' } }}
    >
      <DashboardMonthSelector />
      <DashboardHeaderActionButton
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
      >
        {t('report')}
      </DashboardHeaderActionButton>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box
      sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 }, bgcolor: surface.app }}
    >
      <Stack spacing={2.4}>
        <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
        <AgencyOverviewKpiGrid kpis={overview?.kpis ?? []} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
            gap: 1.6,
            alignItems: 'stretch',
          }}
        >
          <AgencyRevenuePerformancePanel revenuePoints={overview?.revenuePoints ?? []} />
          <AgencyTopBrokersPanel topBrokers={overview?.topBrokers ?? []} />
        </Box>

        <AgencyRecentActivityPanel activities={overview?.activities ?? []} />
      </Stack>
    </Box>
  )
}
