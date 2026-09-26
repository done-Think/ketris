import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Button, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { AgencyOverviewKpiGrid } from './AgencyOverviewKpiGrid'
import { AgencyRecentActivityPanel } from './AgencyRecentActivityPanel'
import { AgencyRevenuePerformancePanel } from './AgencyRevenuePerformancePanel'
import { AgencyTopBrokersPanel } from './AgencyTopBrokersPanel'

export function AgencyOverviewPage() {
  const t = useTranslations('dashboard.agencyOverview')
  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { sm: 'center' } }}
    >
      <Button
        type="button"
        variant="outlined"
        startIcon={<CalendarTodayOutlinedIcon sx={{ color: brand.neutral[500], fontSize: 18 }} />}
        sx={{
          minHeight: 36,
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {t('month')}
      </Button>
      <Button
        type="button"
        variant="contained"
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{
          minHeight: 36,
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {t('report')}
      </Button>
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
        <AgencyOverviewKpiGrid />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
            gap: 1.6,
            alignItems: 'stretch',
          }}
        >
          <AgencyRevenuePerformancePanel />
          <AgencyTopBrokersPanel />
        </Box>

        <AgencyRecentActivityPanel />
      </Stack>
    </Box>
  )
}
