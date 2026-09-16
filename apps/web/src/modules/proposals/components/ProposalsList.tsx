'use client'

import { Box, Chip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { alpha, brand, motion, radius } from '@shared/theme/tokens'

import { proposalStatusStyles } from '../config/proposal-status-styles'
import type { DashboardProposal, ProposalsListProps } from '../types/proposal'
import { ProposalDetailDialog } from './ProposalDetailDialog'

export function ProposalsList({ proposals }: ProposalsListProps) {
  const t = useTranslations('dashboard.proposals')
  const searchParams = useSearchParams()
  const [selectedProposal, setSelectedProposal] = useState<DashboardProposal | null>(null)

  useEffect(() => {
    const proposalId = searchParams.get('proposalId')
    const proposal = proposals.find((currentProposal) => currentProposal.id === proposalId)
    if (!proposal) return

    setSelectedProposal(proposal)
  }, [proposals, searchParams])

  return (
    <>
      {proposals.map((proposal) => {
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
            <Typography sx={{ color: 'text.secondary' }}>{proposal.ownerExpectation}</Typography>
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

      <ProposalDetailDialog
        proposal={selectedProposal}
        open={Boolean(selectedProposal)}
        onClose={() => setSelectedProposal(null)}
      />
    </>
  )
}
