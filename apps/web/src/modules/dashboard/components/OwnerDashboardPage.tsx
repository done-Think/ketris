import { Box, Button, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { brand, radius } from '@shared/theme/tokens'

import { OwnerMetricCards } from './OwnerMetricCards'
import { OwnerQuickActions } from './OwnerQuickActions'
import { RecentProposalsCard } from './RecentProposalsCard'
import { UpcomingVisitsCard } from './UpcomingVisitsCard'
import { WeeklyPerformanceCard } from './WeeklyPerformanceCard'

export function OwnerDashboardPage() {
  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, md: 4.5 } }}>
      <Box sx={{ width: '100%', maxWidth: 1184, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Typography
            component="h1"
            sx={{
              color: brand.graphite[500],
              fontSize: { xs: 27, md: 32 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Painel do Proprietário
          </Typography>
          <Button
            component={NextLink}
            href="/dashboard/imoveis/novo"
            variant="contained"
            sx={{
              alignSelf: { xs: 'stretch', sm: 'center' },
              minHeight: 44,
              borderRadius: `${radius.sm}px`,
              px: 2.6,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Anunciar Novo Imóvel
          </Button>
        </Stack>

        <Box sx={{ mt: { xs: 2.5, md: 3.5 } }}>
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
            gap: { xs: 2, md: 2.5, lg: 3 },
            mt: { xs: 2, md: 3 },
          }}
        >
          <RecentProposalsCard />
          <Stack spacing={{ xs: 2, md: 2.5 }}>
            <UpcomingVisitsCard />
            <WeeklyPerformanceCard />
          </Stack>
        </Box>

        <Box sx={{ mt: { xs: 2.5, md: 3.5 } }}>
          <OwnerQuickActions />
        </Box>
      </Box>
    </Box>
  )
}
