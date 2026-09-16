import { Box, Divider, Stack, Typography } from '@mui/material'

import { brand } from '@shared/theme/tokens'

import type { ProposalMobileCardsProps } from '../../types/proposal-management'
import { ProposalStatusChip } from '../ProposalStatusChip'
import { ProposalActions } from './ProposalActions'

export function ProposalMobileCards({
  proposals,
  onViewProposal,
  onOpenMoreOptions,
}: ProposalMobileCardsProps) {
  return (
    <Stack
      aria-label="Lista móvel de propostas"
      sx={{ display: { xs: 'flex', md: 'none' } }}
      divider={<Divider />}
    >
      {proposals.map((proposal) => (
        <Stack key={proposal.id} spacing={1.5} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
                {proposal.reference}
              </Typography>
              <ProposalStatusChip status={proposal.status} />
            </Stack>
            <ProposalActions
              proposal={proposal}
              onViewProposal={onViewProposal}
              onOpenMoreOptions={onOpenMoreOptions}
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 1.5,
            }}
          >
            <Stack spacing={0.25} minWidth={0}>
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Lead
              </Typography>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                {proposal.lead.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11 }}>
                {proposal.lead.email}
              </Typography>
            </Stack>

            <Stack spacing={0.25} minWidth={0}>
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Imóvel
              </Typography>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                {proposal.property.title}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11 }}>
                {proposal.property.address}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2}>
            <Stack spacing={0.25}>
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Valor
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
                {proposal.valueLabel}
              </Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: 11.5 }}>
              Criada em {proposal.createdLabel}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
