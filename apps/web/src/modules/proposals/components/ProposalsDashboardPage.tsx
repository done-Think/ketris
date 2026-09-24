import { Box, Stack } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardProposals } from '../data/proposals'
import { ProposalsList } from './ProposalsList'

export async function ProposalsDashboardPage() {
  const t = await getTranslations('dashboard.proposals')

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <DashboardNotificationsButton />
            </Box>
          }
        />

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
