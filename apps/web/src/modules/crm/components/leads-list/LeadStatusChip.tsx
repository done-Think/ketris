import { Chip } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, supportColor } from '@shared/theme/tokens'

import type { LeadFilterKey, LeadStage, LeadStatusChipProps } from '../../types/lead'

const leadStagePresentation: Record<
  LeadStage,
  { labelKey: LeadFilterKey; color: string; backgroundColor: string }
> = {
  Novo: { labelKey: 'new', color: brand.magenta[700], backgroundColor: alpha.magenta[10] },
  'Em contato': {
    labelKey: 'contacted',
    color: brand.semantic.info,
    backgroundColor: supportColor.infoSoft,
  },
  'Visita marcada': {
    labelKey: 'visitScheduled',
    color: brand.semantic.warning,
    backgroundColor: supportColor.warningSoft,
  },
  Proposta: {
    labelKey: 'proposal',
    color: brand.semantic.success,
    backgroundColor: supportColor.successSoft,
  },
}

export function LeadStatusChip({ stage }: LeadStatusChipProps) {
  const t = useTranslations('crm.leads')
  const presentation = leadStagePresentation[stage]

  return (
    <Chip
      label={t(`filters.${presentation.labelKey}`)}
      size="small"
      sx={{
        width: 'fit-content',
        height: 22,
        bgcolor: presentation.backgroundColor,
        color: presentation.color,
        borderRadius: `${radius.full}px`,
        fontSize: 10.5,
        fontWeight: 900,
        '& .MuiChip-label': { px: 1.125 },
      }}
    />
  )
}
