'use client'

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, radius } from '@shared/theme/tokens'

import {
  growthTrend,
  platformAlerts,
  platformLiveUtcDisplay,
  platformMetrics,
  recentTenants,
} from '../data/platform-overview-fixtures'
import { PlatformGrowthChart } from './PlatformGrowthChart'
import { PlatformMetricCards } from './PlatformMetricCards'
import { RecentTenantsTable } from './RecentTenantsTable'
import { PlatformSystemAlerts } from './PlatformSystemAlerts'

export function PlatformOverview() {
  const t = useTranslations('platform.overview')

  return (
    <Box
      sx={{
        maxWidth: 1360,
        mx: 'auto',
        px: { xs: 1.5, sm: 2.5, lg: 3 },
        py: { xs: 2.25, md: 3.5 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1.2}
        sx={{ mb: 2.25 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.1}>
          <Typography
            component="h1"
            sx={{
              color: brand.graphite[500],
              fontSize: { xs: 22, md: 24 },
              fontWeight: 900,
              letterSpacing: -0.45,
            }}
          >
            {t('title')}
          </Typography>
          <Chip
            label={t('production')}
            size="small"
            sx={{
              bgcolor: '#E7F7EE',
              border: '1px solid',
              borderColor: brand.semantic.success,
              color: brand.semantic.success,
              borderRadius: `${radius.full}px`,
              fontSize: 9,
              fontWeight: 800,
              height: 20,
            }}
          />
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.55}
          sx={{ color: brand.neutral[500] }}
        >
          <AccessTimeOutlinedIcon sx={{ fontSize: 15 }} />
          <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
            {t('liveUtc', { value: platformLiveUtcDisplay })}
          </Typography>
        </Stack>
      </Stack>
      <PlatformMetricCards metrics={platformMetrics} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.62fr) minmax(300px, 0.95fr)' },
          gap: 1.6,
          mt: 2.25,
        }}
      >
        <PlatformGrowthChart trend={growthTrend} />
        <PlatformSystemAlerts alerts={platformAlerts} />
      </Box>
      <Box sx={{ mt: 2.25 }}>
        <RecentTenantsTable tenants={recentTenants} />
      </Box>
    </Box>
  )
}
