import { Box, Chip, Paper, Stack, Typography } from '@mui/material'

import { brand, radius, supportColor, surface, shadows } from '@shared/theme/tokens'

import { ownerUpcomingVisits } from '../fixtures/owner-dashboard-fixtures'
import {
  ownerDashboardMetaSx,
  ownerDashboardPanelSx,
  ownerDashboardSectionTitleSx,
} from './owner-dashboard.styles'

export function UpcomingVisitsCard() {
  return (
    <Paper
      component="section"
      aria-labelledby="upcoming-visits-title"
      elevation={0}
      sx={{
        ...ownerDashboardPanelSx,
        p: { xs: 0, md: 2.75 },
        bgcolor: { xs: 'transparent', md: surface.paper },
        border: { xs: 0, md: ownerDashboardPanelSx.border },
        boxShadow: { xs: 'none', md: ownerDashboardPanelSx.boxShadow },
      }}
    >
      <Typography
        id="upcoming-visits-title"
        component="h2"
        sx={{ ...ownerDashboardSectionTitleSx, display: { xs: 'none', md: 'block' } }}
      >
        Próximas Visitas
      </Typography>
      <Typography
        component="h2"
        sx={{
          display: { xs: 'block', md: 'none' },
          color: brand.neutral[600],
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        VISITAS AGENDADAS
      </Typography>

      <Stack sx={{ mt: 1.35, gap: { xs: 1.5, md: 0 } }}>
        {ownerUpcomingVisits.map((visit, index) => (
          <Box
            key={visit.id}
            sx={{
              display: { xs: visit.mobileVisible === false ? 'none' : 'grid', md: 'grid' },
              gridTemplateColumns: {
                xs: '54px minmax(0, 1fr)',
                md: '58px 54px minmax(0, 1fr) auto',
              },
              alignItems: 'center',
              minHeight: { xs: 86, md: 61 },
              borderBottom: {
                xs: 0,
                md: index === ownerUpcomingVisits.length - 1 ? 0 : '1px solid',
              },
              borderColor: brand.neutral[100],
              columnGap: { xs: 1.5, md: 1 },
              p: { xs: 1.5, md: 0 },
              py: { xs: 1.5, md: 0.5 },
              bgcolor: { xs: surface.paper, md: 'transparent' },
              borderRadius: { xs: `${radius.md}px`, md: 0 },
              boxShadow: { xs: shadows.crmCardCompact, md: 'none' },
            }}
          >
            <Box
              sx={{
                justifySelf: 'start',
                gridRow: { xs: 'span 2', md: 'auto' },
                borderRadius: `${radius.sm}px`,
                bgcolor: { xs: surface.app, md: supportColor.infoSoft },
                color: brand.graphite[500],
                px: 1,
                py: 0.65,
                fontSize: 10.5,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                {visit.date}
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center' }}
              >
                {visit.mobileDate || visit.date}
              </Box>
              <Box
                component="span"
                sx={{
                  display: { xs: 'block', md: 'none' },
                  mt: 0.75,
                  textAlign: 'center',
                  color: 'primary.main',
                  fontSize: 11,
                }}
              >
                {visit.time}
              </Box>
            </Box>
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                color: brand.magenta[600],
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {visit.time}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 700 }}>
                {visit.property}
              </Typography>
              <Typography noWrap sx={ownerDashboardMetaSx}>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                  Visitante:{' '}
                </Box>
                {visit.visitor}
              </Typography>
            </Box>
            <Chip
              label={visit.status}
              size="small"
              sx={{
                gridColumn: { xs: '2', md: 'auto' },
                justifySelf: { xs: 'start', md: 'end' },
                mt: { xs: 0.5, md: 0 },
                height: { xs: 18, md: 22 },
                bgcolor: supportColor.successSoft,
                borderRadius: `${radius.sm}px`,
                color: brand.semantic.success,
                fontSize: 10,
                fontWeight: 700,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}
