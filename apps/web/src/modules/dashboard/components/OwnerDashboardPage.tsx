import { Box, Stack, Typography } from '@mui/material'

import { brand } from '@shared/theme/tokens'

import { OwnerMetricCards } from './OwnerMetricCards'
import { OwnerQuickActions } from './OwnerQuickActions'
import { RecentProposalsCard } from './RecentProposalsCard'
import { UpcomingVisitsCard } from './UpcomingVisitsCard'
import { WeeklyPerformanceCard } from './WeeklyPerformanceCard'
import { OwnerDashboardMobileHeader } from './OwnerDashboardMobileHeader'
import { OwnerCreatePropertyButton } from './OwnerCreatePropertyButton'
import {
  ownerDashboardBodyFontFamily,
  ownerDashboardDisplayFontFamily,
} from './owner-dashboard.styles'

export function OwnerDashboardPage() {
  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 1.5, md: 4 },
        fontFamily: ownerDashboardBodyFontFamily,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1184, mx: 'auto' }}>
        <OwnerDashboardMobileHeader />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          <Typography
            component="h1"
            sx={{
              color: brand.graphite[500],
              fontFamily: ownerDashboardDisplayFontFamily,
              fontSize: { xs: 27, md: 24 },
              fontWeight: 700,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
            }}
          >
            Painel do Proprietário
          </Typography>
          <OwnerCreatePropertyButton />
        </Stack>

        <Box sx={{ mt: { xs: 2, md: 3.25 } }}>
          <OwnerMetricCards />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 1.3fr) minmax(360px, 1fr)',
            },
            alignItems: 'stretch',
            gap: { xs: 3, md: 2.75, lg: 3 },
            mt: { xs: 4, md: 3.25 },
          }}
        >
          <RecentProposalsCard />
          <Stack spacing={{ xs: 2, md: 2.5 }}>
            <UpcomingVisitsCard />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <WeeklyPerformanceCard />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: { xs: 2.5, md: 3.75 } }}>
          <OwnerQuickActions />
        </Box>
      </Box>
    </Box>
  )
}
