import type { SxProps, Theme } from '@mui/material'
import type { CrmChipColors } from '../types/style'

import { alpha, brand, radius, supportColor } from '@shared/theme/tokens'
import type { LeadFilterKey, LeadStage } from '../types/lead'

export function getChipSx(presentation: CrmChipColors): SxProps<Theme> {
  return {
    width: 'fit-content',
    height: 24,
    bgcolor: presentation.backgroundColor,
    color: presentation.color,
    borderRadius: `${radius.full}px`,
    fontSize: 14,
    fontWeight: 900,
    '& .MuiChip-label': { px: 1.125 },
  }
}

export const leadStagePresentation: Record<
  LeadStage,
  { labelKey: LeadFilterKey; color: string; backgroundColor: string }
> = {
  NEW: { labelKey: 'new', color: brand.magenta[700], backgroundColor: alpha.magenta[10] },
  IN_CONTACT: {
    labelKey: 'contacted',
    color: brand.semantic.info,
    backgroundColor: supportColor.infoSoft,
  },
  VISIT_SCHEDULED: {
    labelKey: 'visitScheduled',
    color: brand.semantic.warning,
    backgroundColor: supportColor.warningSoft,
  },
  PROPOSAL: {
    labelKey: 'proposal',
    color: brand.semantic.success,
    backgroundColor: supportColor.successSoft,
  },
}
