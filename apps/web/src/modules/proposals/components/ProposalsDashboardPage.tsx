'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardProposals } from '../data/proposals'
import type {
  DashboardProposal,
  ProposalDetailDialogProps,
  ProposalStatus,
} from '../types/proposal'

const proposalStatusStyles: Record<ProposalStatus, { bgcolor: string; color: string }> = {
  underReview: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  counteroffer: { bgcolor: alpha.magenta[6], color: brand.magenta[700] },
  approved: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
}

function ProposalDetailDialog({ onClose, open, proposal }: ProposalDetailDialogProps) {
  const t = useTranslations('dashboard.proposals')

  if (!proposal) return null

  const status = proposalStatusStyles[proposal.status]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
              {t('detail.eyebrow')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {proposal.client}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {proposal.property}
            </Typography>
          </Box>
          <IconButton aria-label={t('detail.close')} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6 }}>
        <Box
          sx={{
            bgcolor: surface.app,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.4,
            p: 1.6,
          }}
        >
          <Box>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t('detail.value')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
              {proposal.value}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t('detail.ownerExpectation')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
              {proposal.ownerExpectation}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t('detail.status')}
            </Typography>
            <Chip
              label={t(`statuses.${proposal.status}`)}
              sx={{
                bgcolor: status.bgcolor,
                color: status.color,
                borderRadius: `${radius.full}px`,
                fontWeight: 900,
                mt: 0.6,
              }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export function ProposalsDashboardPage() {
  const t = useTranslations('dashboard.proposals')
  const searchParams = useSearchParams()
  const [selectedProposal, setSelectedProposal] = useState<DashboardProposal | null>(null)

  useEffect(() => {
    const proposalId = searchParams.get('proposalId')
    const proposal = dashboardProposals.find((currentProposal) => currentProposal.id === proposalId)
    if (!proposal) return

    setSelectedProposal(proposal)
  }, [searchParams])

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
              {t('title')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
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
          {dashboardProposals.map((proposal) => {
            const status = proposalStatusStyles[proposal.status]

            return (
              <Box
                key={proposal.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProposal(proposal)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedProposal(proposal)
                  }
                }}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr 0.9fr 0.9fr 0.8fr' },
                  gap: 1.4,
                  alignItems: 'center',
                  px: 2.4,
                  py: 1.9,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: motion.transition.interactive,
                  '&:hover': { bgcolor: brand.neutral[50] },
                  '&:focus-visible': {
                    bgcolor: alpha.magenta[6],
                    outline: 0,
                  },
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
      <ProposalDetailDialog
        proposal={selectedProposal}
        open={Boolean(selectedProposal)}
        onClose={() => setSelectedProposal(null)}
      />
    </Box>
  )
}
