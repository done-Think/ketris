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
        p: { xs: 1.8, md: 2 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.1 }}>
        <Typography
          id="system-alerts-title"
          sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}
        >
          {t('title')}
        </Typography>
        <Typography sx={{ color: brand.semantic.error, fontSize: 10, fontWeight: 800 }}>
          {t('active', { count: alerts.length })}
        </Typography>
      </Stack>
      <Stack spacing={0.8}>
        {alerts.map((alert) => (
          <Box
            key={alert.id}
            sx={{
              borderLeft: '3px solid',
              borderColor: alertColors[alert.tone],
              bgcolor: brand.neutral[50],
              borderRadius: `${radius.sm}px`,
              px: 1,
              py: 0.85,
            }}
          >
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Typography sx={{ color: brand.graphite[500], fontSize: 10.5, fontWeight: 900 }}>
                {t(`${alert.id}.title`)}
              </Typography>
              <Typography sx={{ color: brand.neutral[500], fontSize: 9, whiteSpace: 'nowrap' }}>
                {alert.time}
              </Typography>
            </Stack>
            <Typography
              sx={{ color: brand.neutral[500], fontSize: 9.5, lineHeight: 1.35, mt: 0.35 }}
            >
              {t(`${alert.id}.description`)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
