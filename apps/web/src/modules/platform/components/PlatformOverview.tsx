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
import { TenantsList } from './TenantsList'

export function PlatformOverview() {
  const t = useTranslations('platform.overview')

  return (
    <Box
      sx={{
        maxWidth: 1680,
        mx: 'auto',
        px: { xs: 1.5, sm: 3, lg: 4 },
        py: { xs: 2.5, md: 4 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.3}>
          <Typography
            component="h1"
            sx={{
              color: brand.graphite[500],
              fontSize: { xs: 24, md: 30 },
              lineHeight: 1.15,
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
              fontSize: 10,
              fontWeight: 800,
              height: 24,
            }}
          />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ color: brand.neutral[500] }}>
          <AccessTimeOutlinedIcon sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
            {t('liveUtc', { value: platformLiveUtcDisplay })}
          </Typography>
        </Stack>
      </Stack>
      <PlatformMetricCards metrics={platformMetrics} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(360px, 0.95fr)' },
          gap: 2,
          mt: 3,
        }}
      >
        <PlatformGrowthChart trend={growthTrend} />
        <PlatformSystemAlerts alerts={platformAlerts} />
      </Box>
      <Box sx={{ mt: 3 }}>
        <RecentTenantsTable tenants={recentTenants} />
      </Box>
      <Box component="section" aria-labelledby="registered-tenants-title" sx={{ mt: 3 }}>
        <Typography
          id="registered-tenants-title"
          sx={{ color: brand.graphite[500], fontSize: 17, fontWeight: 900, mb: 2 }}
        >
          {t('registeredTenants')}
        </Typography>
        <TenantsList />
      </Box>
    </Box>
  )
}
