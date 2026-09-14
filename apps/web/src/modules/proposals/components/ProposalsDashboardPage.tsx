import { Box, Chip, Stack, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardProposals } from '../data/proposals'
import type { ProposalStatus } from '../types/proposal'

const proposalStatusStyles: Record<ProposalStatus, { bgcolor: string; color: string }> = {
  underReview: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  counteroffer: { bgcolor: alpha.magenta[6], color: brand.magenta[700] },
  approved: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
}

export async function ProposalsDashboardPage() {
  const t = await getTranslations('dashboard.proposals')

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
            {t('title')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
            {t('subtitle')}
          </Typography>
        </Box>

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
          {dashboardProposals.map((proposal) => {
            const status = proposalStatusStyles[proposal.status]

            return (
              <Box
                key={proposal.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr 0.9fr 0.9fr 0.8fr' },
                  gap: 1.4,
                  alignItems: 'center',
                  px: 2.4,
                  py: 1.9,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  transition: motion.transition.interactive,
                  '&:hover': { bgcolor: brand.neutral[50] },
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>{proposal.client}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{proposal.property}</Typography>
                <Typography sx={{ fontWeight: 900 }}>{proposal.value}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {proposal.ownerExpectation}
                </Typography>
                <Chip
                  label={t(`statuses.${proposal.status}`)}
                  sx={{
                    justifySelf: { md: 'end' },
                    width: 'fit-content',
                    bgcolor: status.bgcolor,
                    color: status.color,
                    borderRadius: `${radius.full}px`,
                    fontWeight: 900,
                  }}
                />
              </Box>
            )
          })}
        </Box>
      </Stack>
    </Box>
  )
}
