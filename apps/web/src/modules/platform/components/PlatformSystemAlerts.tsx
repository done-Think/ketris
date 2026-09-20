'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { PlatformAlert, PlatformAlertTone } from '../types/platform-overview'

const alertColors: Record<PlatformAlertTone, string> = {
  error: brand.semantic.error,
  warning: brand.semantic.warning,
  info: brand.semantic.info,
}

export function PlatformSystemAlerts({ alerts }: { alerts: readonly PlatformAlert[] }) {
  const t = useTranslations('platform.overview.alerts')

  return (
    <Box
      component="section"
      aria-labelledby="system-alerts-title"
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.md}px`,
        boxShadow: shadows.crmCard,
        minHeight: { lg: 400 },
        p: { xs: 2, md: 2.75 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography
          id="system-alerts-title"
          sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}
        >
          {t('title')}
        </Typography>
        <Typography sx={{ color: brand.semantic.error, fontSize: 11, fontWeight: 800 }}>
          {t('active', { count: alerts.length })}
        </Typography>
      </Stack>
      <Stack spacing={1}>
        {alerts.map((alert) => (
          <Box
            key={alert.id}
            sx={{
              borderLeft: '3px solid',
              borderColor: alertColors[alert.tone],
              bgcolor: brand.neutral[50],
              borderRadius: `${radius.sm}px`,
              px: 1.35,
              py: 1.15,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 0.35, sm: 1 }}
              justifyContent="space-between"
            >
              <Typography sx={{ color: brand.graphite[500], fontSize: 12.5, fontWeight: 900 }}>
                {t(`${alert.id}.title`)}
              </Typography>
              <Typography sx={{ color: brand.neutral[500], fontSize: 10.5, whiteSpace: 'nowrap' }}>
                {alert.time}
              </Typography>
            </Stack>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, lineHeight: 1.4, mt: 0.45 }}>
              {t(`${alert.id}.description`)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
