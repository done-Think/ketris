import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { contractMetricToneStyles } from '../config/contract-ui'
import type { ContractsSummaryCardsProps } from '../types/contract'

export function ContractsSummaryCards({ metrics }: ContractsSummaryCardsProps) {
  const t = useTranslations('contracts.summary')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(3, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: { xs: 0.8, md: 1.9 },
        mb: 2.6,
      }}
    >
      {metrics.map((metric) => {
        const tone = contractMetricToneStyles[metric.tone]
        const MetricIcon = metric.tone === 'warning' ? ShowChartRoundedIcon : TrendingUpRoundedIcon

        return (
          <Stack
            key={metric.label}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            spacing={{ xs: 0.4, md: 2 }}
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              minHeight: { xs: 84, md: 'auto' },
              p: { xs: 1.2, md: 2.2 },
              boxShadow: shadows.crmCardCompact,
            }}
          >
            <Stack spacing={0.7} sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <Typography
                noWrap
                sx={{
                  color: brand.neutral[500],
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: { xs: 10, md: 11 },
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                {t(`${metric.label}.label`)}
              </Typography>
              <Typography
                sx={{
                  color: brand.graphite[500],
                  fontSize: { xs: 24, md: 28 },
                  lineHeight: 1.1,
                  fontWeight: 900,
                }}
              >
                {metric.value}
              </Typography>
              <Typography
                noWrap
                sx={{
                  display: { xs: 'block', md: 'none' },
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: brand.neutral[500],
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {t(`${metric.label}.caption`)}
              </Typography>
            </Stack>
            <Box
              aria-hidden
              sx={{
                width: 40,
                height: 40,
                borderRadius: radius.full,
                bgcolor: tone.bgcolor,
                color: tone.color,
                display: { xs: 'none', md: 'grid' },
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <MetricIcon sx={{ fontSize: iconSize.md }} />
            </Box>
          </Stack>
        )
      })}
    </Box>
  )
}
