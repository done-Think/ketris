import type { SxProps, Theme } from '@mui/material'
import type { CrmChipColors } from '../types/style'

import { radius } from '@shared/theme/tokens'

export function getChipSx(presentation: CrmChipColors): SxProps<Theme> {
  return {
    height: 24,
    borderRadius: `${radius.full}px`,
    bgcolor: presentation.backgroundColor,
    color: presentation.color,
    fontSize: 14,
    fontWeight: 700,
    '& .MuiChip-label': { px: 1.125 },
  }
}
