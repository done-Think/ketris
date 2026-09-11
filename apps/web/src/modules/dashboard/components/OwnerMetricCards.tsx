import { Box, Chip, Paper, Stack, Typography } from '@mui/material'

import { brand, radius, surface, supportColor } from '@shared/theme/tokens'

import { ownerDashboardMetrics, ownerMobileSummary } from '../fixtures/owner-dashboard-fixtures'
import { ownerDashboardPanelSx } from './owner-dashboard.styles'

export function OwnerMetricCards() {
  return (
    <Box
      role="group"
      aria-label="Indicadores do painel do proprietário"
      sx={{
        display: { xs: 'block', md: 'grid' },
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, 1fr)' },
        gap: { xs: 1.5, md: 2.25 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          ...ownerDashboardPanelSx,
          display: { xs: 'block', md: 'none' },
          borderLeft: '3px solid',
          borderLeftColor: 'primary.main',
          p: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
            {ownerMobileSummary.totalProperties} imóveis anunciados
          </Typography>
          <Stack direction="row" spacing={0.75}>
            <Box
              component="span"
              sx={{
                bgcolor: supportColor.successSoft,
                color: brand.semantic.success,
                px: 0.75,
                py: 0.25,
                borderRadius: `${radius.sm}px`,
                fontSize: 10,
              }}
            >
              {ownerMobileSummary.activeProperties} ativos
            </Box>
            <Box
              component="span"
              sx={{
                bgcolor: brand.neutral[100],
                color: brand.neutral[600],
                px: 0.75,
                py: 0.25,
                borderRadius: `${radius.sm}px`,
                fontSize: 10,
              }}
            >
              {ownerMobileSummary.pausedProperties} pausado
            </Box>
          </Stack>
        </Stack>
        <Typography sx={{ mt: 1, color: brand.neutral[500], fontSize: 11 }}>
          {ownerDashboardMetrics.find((metric) => metric.id === 'potential-revenue')?.value}/mês em
          receita potencial
        </Typography>
      </Paper>
      {ownerDashboardMetrics.map((metric) => (
        <Paper
          component="article"
          key={metric.id}
          elevation={0}
          sx={{
            ...ownerDashboardPanelSx,
            display: { xs: 'none', md: 'flex' },
            minWidth: 0,
            minHeight: { xs: 132, md: 144 },
            p: { xs: 2, md: 2.75 },
          }}
        >
          <Stack sx={{ minWidth: 0, width: '100%' }}>
            <Typography
              sx={{
                color: brand.neutral[600],
                fontSize: { xs: 11.5, md: 13 },
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              {metric.label}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.15 }}>
              <Typography
                sx={{
                  color: brand.graphite[500],
                  fontSize: { xs: metric.id === 'potential-revenue' ? 23 : 27, md: 31 },
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {metric.value}
              </Typography>
              {metric.badge ? (
                <Chip
                  label={metric.badge}
                  size="small"
                  sx={{
                    width: 22,
                    height: 22,
                    bgcolor: brand.magenta[500],
                    borderRadius: `${radius.full}px`,
                    color: surface.lightText,
                    fontSize: 10,
                    fontWeight: 700,
                    '& .MuiChip-label': { px: 0 },
                  }}
                />
              ) : null}
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.6}
              sx={{ mt: 'auto', minWidth: 0 }}
            >
              {metric.trend ? (
                <Typography
                  component="span"
                  sx={{
                    color: brand.semantic.success,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {metric.trend}
                </Typography>
              ) : null}
              <Typography
                sx={{
                  color: brand.neutral[400],
                  fontSize: { xs: 10, md: 11.5 },
                  lineHeight: 1.3,
                }}
              >
                {metric.caption}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
