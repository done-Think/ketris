import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Stack, Typography } from '@mui/material'

import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { contractMetricToneStyles } from '../config/contract-ui'
import type { ContractsSummaryCardsProps } from '../types/contract'

export function ContractsSummaryCards({ metrics }: ContractsSummaryCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 1.9,
        mb: 2.6,
      }}
    >
      {metrics.map((metric) => {
        const tone = contractMetricToneStyles[metric.tone]
        const MetricIcon = metric.tone === 'warning' ? ShowChartRoundedIcon : TrendingUpRoundedIcon

        return (
          <Stack
            key={metric.label}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              minWidth: 0,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              minHeight: 138,
              p: { xs: 2.2, md: 2.9 },
              boxShadow: shadows.crmCardCompact,
            }}
          >
            <Stack spacing={1.1} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 14, fontWeight: 800 }}>
                {metric.label}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 36, fontWeight: 900 }}>
                {metric.value}
              </Typography>
            </Stack>
            <Box
              aria-hidden
              sx={{
                width: 50,
                height: 50,
                borderRadius: radius.full,
                bgcolor: tone.bgcolor,
                color: tone.color,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <MetricIcon sx={{ fontSize: iconSize.lg }} />
            </Box>
          </Stack>
        )
      })}
    </Box>
  )
}
