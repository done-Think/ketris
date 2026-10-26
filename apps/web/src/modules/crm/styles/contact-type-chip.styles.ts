import type { SxProps, Theme } from '@mui/material'
import type { CrmChipColors } from '../types/style'

import { alpha as muiAlpha } from '@mui/material/styles'
import { brand, radius } from '@shared/theme/tokens'
import type { ContactType } from '../types/contact'

export function getChipSx(presentation: CrmChipColors): SxProps<Theme> {
  return {
    height: 24,
    borderRadius: `${radius.full}px`,
    bgcolor: presentation.backgroundColor,
    color: presentation.color,
    fontSize: 14,
    fontWeight: 600,
    '& .MuiChip-label': { px: 1 },
  }
}

export const typePresentation: Record<ContactType, CrmChipColors> = {
  LOCATARIO: {
    color: brand.semantic.success,
    backgroundColor: muiAlpha(brand.semantic.success, 0.1),
  },
  PROPRIETARIO: {
    color: brand.semantic.info,
    backgroundColor: muiAlpha(brand.semantic.info, 0.1),
  },
  CORRETOR: {
    color: brand.magenta[500],
    backgroundColor: brand.magenta[50],
  },
}
export const contactTypeLabelKeys: Record<ContactType, 'tenant' | 'owner' | 'broker'> = {
  LOCATARIO: 'tenant',
  PROPRIETARIO: 'owner',
  CORRETOR: 'broker',
}
