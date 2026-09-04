import { Box, Chip, Paper, Stack, Typography } from '@mui/material'

import { brand, radius, supportColor } from '@shared/theme/tokens'

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
      sx={{ ...ownerDashboardPanelSx, p: { xs: 2, md: 2.75 } }}
    >
      <Typography id="upcoming-visits-title" component="h2" sx={ownerDashboardSectionTitleSx}>
        Próximas Visitas
      </Typography>

      <Stack sx={{ mt: 1.35 }}>
        {ownerUpcomingVisits.map((visit, index) => (
          <Box
            key={visit.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '46px 48px minmax(0, 1fr)',
                sm: '58px 54px minmax(0, 1fr) auto',
              },
              alignItems: 'center',
              minHeight: 61,
              borderBottom: index === ownerUpcomingVisits.length - 1 ? 0 : '1px solid',
              borderColor: brand.neutral[100],
              columnGap: { xs: 0.75, sm: 1 },
              py: 0.5,
            }}
          >
            <Box
              sx={{
                justifySelf: 'start',
                borderRadius: `${radius.sm}px`,
                bgcolor: supportColor.infoSoft,
                color: brand.graphite[500],
                px: 1,
                py: 0.65,
                fontSize: 10.5,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {visit.date}
            </Box>
            <Typography sx={{ color: brand.magenta[600], fontSize: 12, fontWeight: 700 }}>
              {visit.time}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 700 }}>
                {visit.property}
              </Typography>
              <Typography noWrap sx={ownerDashboardMetaSx}>
                {visit.visitor}
              </Typography>
            </Box>
            <Chip
              label={visit.status}
              size="small"
              sx={{
                gridColumn: { xs: '3', sm: 'auto' },
                justifySelf: 'end',
                mt: { xs: 0.7, sm: 0 },
                height: 22,
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
