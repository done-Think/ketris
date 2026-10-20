'use client'

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { brand, radius } from '@shared/theme/tokens'

import { usePlatformOverview } from '../hooks/use-platform-overview'
import {
  mapGrowthTrend,
  mapPlatformMetricsToCards,
  mapRecentTenants,
} from '../utils/platform-overview-adapter'
import { PlatformGrowthChart } from './PlatformGrowthChart'
import { PlatformMetricCards } from './PlatformMetricCards'
import { RecentTenantsTable } from './RecentTenantsTable'
import { TenantsList } from './TenantsList'

// Current time, set only after mount so the server render and the first client render match.
function useUtcNow() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const timeout = window.setTimeout(tick, 0)
    const interval = window.setInterval(tick, 30_000)

    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [])

  return now
}

export function PlatformOverview() {
  const t = useTranslations('platform.overview')
  const format = useFormatter()
  const utcNow = useUtcNow()
  const overviewQuery = usePlatformOverview()
  const platformMetrics = overviewQuery.data
    ? mapPlatformMetricsToCards(overviewQuery.data.metrics)
    : []
  const growthTrend = overviewQuery.data ? mapGrowthTrend(overviewQuery.data.growthTrend) : []
  const recentTenants = overviewQuery.data ? mapRecentTenants(overviewQuery.data.recentTenants) : []

  return (
    <Box
      sx={{
        width: '100%',
        p: 3.5,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1.6}
        sx={{ pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" alignItems="center" spacing={1.3}>
          <Typography
            component="h1"
            sx={{
              color: brand.graphite[500],
              fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
              fontSize: { xs: 26, sm: 30 },
              lineHeight: 1.15,
              fontWeight: 700,
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
        {utcNow ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.7}
            sx={{ color: brand.neutral[500] }}
          >
            <AccessTimeOutlinedIcon sx={{ fontSize: 17 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
              {t('liveUtc', {
                value: format.dateTime(utcNow, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'UTC',
                }),
              })}
            </Typography>
          </Stack>
        ) : null}
      </Stack>
      <PlatformMetricCards metrics={platformMetrics} />
      <Box sx={{ mt: 3 }}>
        <PlatformGrowthChart trend={growthTrend} />
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
