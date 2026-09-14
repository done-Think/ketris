'use client'

import { Box, Stack, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { FinancialMovementChartProps } from '../types/financial-entry'

export function FinancialMovementChart({ movement }: FinancialMovementChartProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance')
  const totalSales = movement.reduce((total, item) => total + item.sales, 0)
  const totalCommissions = movement.reduce((total, item) => total + item.commissions, 0)
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })

  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        p: { xs: 2, md: 2.4 },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 1.6 }}
      >
        <Box>
          <Typography variant="h5">{t('movementTitle')}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>
            {t('movementSubtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          <Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 800 }}>
              {t('sales')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900 }}>
              {formatCurrency(totalSales)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 800 }}>
              {t('commissions')}
            </Typography>
            <Typography sx={{ color: brand.magenta[600], fontSize: 18, fontWeight: 900 }}>
              {formatCurrency(totalCommissions)}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ width: '100%', height: { xs: 280, md: 340 } }}>
        <LineChart
          dataset={movement}
          xAxis={[{ scaleType: 'point', dataKey: 'month' }]}
          series={[
            {
              dataKey: 'sales',
              label: t('sales'),
              color: brand.graphite[500],
              curve: 'monotoneX',
              showMark: true,
              valueFormatter: (value) => formatCurrency(value ?? 0),
            },
            {
              dataKey: 'commissions',
              label: t('commissions'),
              color: brand.magenta[500],
              curve: 'monotoneX',
              showMark: true,
              valueFormatter: (value) => formatCurrency(value ?? 0),
            },
          ]}
          height={320}
          margin={{ left: 68, right: 18, top: 28, bottom: 36 }}
          grid={{ horizontal: true }}
        />
      </Box>
    </Box>
  )
}
