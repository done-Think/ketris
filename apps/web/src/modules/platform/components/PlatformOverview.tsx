'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { usePlatformOverview } from '../hooks/use-platform-overview'
import {
  mapGrowthTrend,
  mapPlatformMetricsToCards,
  mapRecentTenants,
} from '../utils/platform-overview-adapter'
import { LiveUtcClock } from './LiveUtcClock'
import { PlatformGrowthChart } from './PlatformGrowthChart'
import { PlatformMetricCards } from './PlatformMetricCards'
import { RecentTenantsTable } from './RecentTenantsTable'
import { TenantsList } from './TenantsList'
import { styles } from '../styles/platform-overview.styles'

export function PlatformOverview() {
  const t = useTranslations('platform.overview')
  const overviewQuery = usePlatformOverview()
  const platformMetrics = overviewQuery.data
    ? mapPlatformMetricsToCards(overviewQuery.data.metrics)
    : []
  const growthTrend = overviewQuery.data ? mapGrowthTrend(overviewQuery.data.growthTrend) : []
  const recentTenants = overviewQuery.data ? mapRecentTenants(overviewQuery.data.recentTenants) : []

  return (
    <Box sx={styles.box}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1.6}
        sx={styles.stack}
      >
        <Stack direction="row" alignItems="center" spacing={1.3}>
          <Typography component="h1" sx={styles.typography}>
            {t('title')}
          </Typography>
          <Chip label={t('production')} size="small" sx={styles.chip} />
        </Stack>
        <LiveUtcClock />
      </Stack>
      <PlatformMetricCards metrics={platformMetrics} />
      <Box sx={styles.box2}>
        <PlatformGrowthChart trend={growthTrend} />
      </Box>
      <Box sx={styles.box2}>
        <RecentTenantsTable tenants={recentTenants} />
      </Box>
      <Box component="section" aria-labelledby="registered-tenants-title" sx={styles.box2}>
        <Typography id="registered-tenants-title" sx={styles.typography3}>
          {t('registeredTenants')}
        </Typography>
        <TenantsList />
      </Box>
    </Box>
  )
}
