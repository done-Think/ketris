import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand } from '@shared/theme/tokens'

import type { ProposalMobileCardsProps } from '../../types/proposal-management'
import { ProposalStatusChip } from '../ProposalStatusChip'
import { ProposalActions } from './ProposalActions'

export function ProposalMobileCards({
  proposals,
  onViewProposal,
  onOpenMoreOptions,
}: ProposalMobileCardsProps) {
  const t = useTranslations('crm.proposalManagement')
  return (
    <Stack
      aria-label={t('mobileListAriaLabel')}
      sx={{ display: { xs: 'flex', md: 'none' } }}
      divider={<Divider />}
    >
      {proposals.map((proposal) => (
        <Stack key={proposal.id} spacing={1.5} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 800 }}>
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
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {t('columns.lead')}
              </Typography>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 700 }}>
                {proposal.lead.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15 }}>
                {proposal.lead.email}
              </Typography>
            </Stack>

            <Stack spacing={0.25} minWidth={0}>
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {t('columns.property')}
              </Typography>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 700 }}>
                {proposal.property.title}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15 }}>
                {proposal.property.address}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2}>
            <Stack spacing={0.25}>
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {t('columns.value')}
              </Typography>
              <Typography sx={{ fontSize: 17, fontWeight: 800 }}>{proposal.valueLabel}</Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: 15.5 }}>
              {t('createdAt', { date: proposal.createdLabel })}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
