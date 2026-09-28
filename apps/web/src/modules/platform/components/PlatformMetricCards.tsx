'use client'

import { Box, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { PlatformMetric } from '../types/platform-overview'

export function PlatformMetricCards({ metrics }: { metrics: readonly PlatformMetric[] }) {
  const t = useTranslations('platform.overview.metrics')
  const format = useFormatter()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(6, minmax(0, 1fr))',
        },
        gap: 1.75,
      }}
    >
      {metrics.map((metric) => (
        <Box
          key={metric.id}
          sx={{
            minWidth: 0,
            minHeight: 104,
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[8],
            borderRadius: `${radius.md}px`,
            boxShadow: shadows.crmCardCompact,
            px: 2,
            py: 1.75,
          }}
        >
          <Typography
            sx={{
              color: brand.neutral[500],
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.25,
              textTransform: 'uppercase',
            }}
          >
            {t(`${metric.id}.label`)}
          </Typography>
          <Box
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.9, mt: 0.9 }}
          >
            <Typography
              sx={{
                color: brand.graphite[500],
                fontSize: 23,
                fontWeight: 900,
                letterSpacing: -0.3,
                whiteSpace: 'nowrap',
              }}
            >
              {formatMetricValue(metric, format.number)}
            </Typography>
            {metric.indicator && (
              <Typography
                sx={{
                  color: metric.tone === 'success' ? brand.semantic.success : brand.neutral[500],
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {t(`indicators.${metric.indicator}`)}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function formatMetricValue(
  metric: PlatformMetric,
  number: ReturnType<typeof useFormatter>['number'],
) {
  switch (metric.format) {
    case 'compactNumber':
      return number(metric.value, { notation: 'compact', maximumFractionDigits: 1 })
    case 'compactCurrency':
      return number(metric.value, {
        notation: 'compact',
        maximumFractionDigits: 1,
        style: 'currency',
        currency: 'BRL',
      })
    case 'percent':
      return number(metric.value, { style: 'percent', maximumFractionDigits: 2 })
    default:
      return number(metric.value)
  }
}
