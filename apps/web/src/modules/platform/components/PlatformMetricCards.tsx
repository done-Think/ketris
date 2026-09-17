'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { PlatformMetric } from '../types/platform-overview'

export function PlatformMetricCards({ metrics }: { metrics: readonly PlatformMetric[] }) {
  const t = useTranslations('platform.overview.metrics')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(6, minmax(0, 1fr))',
        },
        gap: 1.25,
      }}
    >
      {metrics.map((metric) => (
        <Box
          key={metric.id}
          sx={{
            minWidth: 0,
            minHeight: 68,
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[8],
            borderRadius: `${radius.md}px`,
            boxShadow: shadows.crmCardCompact,
            px: 1.5,
            py: 1.35,
          }}
        >
          <Typography
            sx={{
              color: brand.neutral[500],
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.25,
              textTransform: 'uppercase',
            }}
          >
            {t(`${metric.id}.label`)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.55 }}>
            <Typography
              sx={{
                color: brand.graphite[500],
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: -0.3,
                whiteSpace: 'nowrap',
              }}
            >
              {metric.value}
            </Typography>
            {metric.indicator && (
              <Typography
                sx={{
                  color: metric.tone === 'success' ? brand.semantic.success : brand.neutral[500],
                  fontSize: 9,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {metric.indicator}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
