import { Chip } from '@mui/material'
import { crmStatusKey } from '@server/crm/constants/translation-keys'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../styles/proposal-status-chip.styles'

import { proposalStatusPresentations } from '../config/proposal-statuses'
import type { ProposalStatusChipProps } from '../types/proposal-management'

export function ProposalStatusChip({ status }: ProposalStatusChipProps) {
  const t = useTranslations('crm.opportunityDetail.statuses')
  const presentation = proposalStatusPresentations[status]

  return (
    <Chip label={t(crmStatusKey(status))} size="small" sx={crmStyles.getChipSx(presentation)} />
  )
}
