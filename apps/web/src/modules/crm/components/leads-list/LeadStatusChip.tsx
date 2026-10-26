import { Chip } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/lead-status-chip.styles'

import type { LeadStatusChipProps } from '../../types/lead'

export function LeadStatusChip({ stage }: LeadStatusChipProps) {
  const t = useTranslations('crm.leads')
  const presentation = crmStyles.leadStagePresentation[stage]

  return (
    <Chip
      label={t(`filters.${presentation.labelKey}`)}
      size="small"
      sx={crmStyles.getChipSx(presentation)}
    />
  )
}
