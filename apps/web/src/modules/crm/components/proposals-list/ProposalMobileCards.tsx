import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/proposal-mobile-cards.styles'

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
    <Stack aria-label={t('mobileListAriaLabel')} sx={crmStyles.stackSx} divider={<Divider />}>
      {proposals.map((proposal) => (
        <Stack key={proposal.id} spacing={1.5} sx={crmStyles.stackSx2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
              <Typography noWrap sx={crmStyles.typographySx}>
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

          <Box sx={crmStyles.boxSx}>
            <Stack spacing={0.25} minWidth={0}>
              <Typography sx={crmStyles.typographySx2}>{t('columns.lead')}</Typography>
              <Typography noWrap sx={crmStyles.typographySx3}>
                {proposal.lead.name}
              </Typography>
              <Typography noWrap sx={crmStyles.typographySx4}>
                {proposal.lead.email}
              </Typography>
            </Stack>

            <Stack spacing={0.25} minWidth={0}>
              <Typography sx={crmStyles.typographySx2}>{t('columns.property')}</Typography>
              <Typography noWrap sx={crmStyles.typographySx3}>
                {proposal.property.title}
              </Typography>
              <Typography noWrap sx={crmStyles.typographySx4}>
                {proposal.property.address}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2}>
            <Stack spacing={0.25}>
              <Typography sx={crmStyles.typographySx2}>{t('columns.value')}</Typography>
              <Typography sx={crmStyles.typographySx5}>{proposal.valueLabel}</Typography>
            </Stack>
            <Typography sx={crmStyles.typographySx6}>
              {t('createdAt', { date: proposal.createdLabel })}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
