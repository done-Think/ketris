import { Chip } from '@mui/material'
import { useTranslations } from 'next-intl'

import { radius } from '@shared/theme/tokens'

import { leadStageLabelKeys, leadStageStyles } from '../config/lead-dashboard-ui'
import type { LeadStatusChipProps } from '../types/lead'

export function LeadStatusChip({ stage }: LeadStatusChipProps) {
  const t = useTranslations('crm.leads')
  const status = leadStageStyles[stage]

  return (
    <Chip
      label={t(`filters.${leadStageLabelKeys[stage]}`)}
      size="small"
      sx={{
        width: 'fit-content',
        bgcolor: status.bgcolor,
        color: status.color,
        borderRadius: `${radius.full}px`,
        fontSize: 11,
        fontWeight: 900,
      }}
    />
  )
}
