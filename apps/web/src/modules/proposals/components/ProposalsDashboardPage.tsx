import { Box, Stack, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardProposals } from '../data/proposals'
import { ProposalsList } from './ProposalsList'

export async function ProposalsDashboardPage() {
  const t = await getTranslations('dashboard.proposals')

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800 }}>
              {t('title')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>
              {t('subtitle')}
            </Typography>
          </Box>
          <DashboardNotificationsButton />
        </Stack>

        <Box
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.propertyCard,
            overflow: 'hidden',
          }}
        >
          <ProposalsList proposals={dashboardProposals} />
        </Box>
      </Stack>
    </Box>
  )
}
