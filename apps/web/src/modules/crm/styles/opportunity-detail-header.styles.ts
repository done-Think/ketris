import type { SxProps, Theme } from '@mui/material'
import type { CrmStatusColors } from '../types/style'

export const breadcrumbsSx: SxProps<Theme> = {
  mb: 1.2,
  '& .MuiBreadcrumbs-separator': { color: 'text.disabled' },
}

export const stackSx: SxProps<Theme> = { mb: 2.5 }

export const typographySx: SxProps<Theme> = { fontSize: { xs: 27, md: 31 }, fontWeight: 800 }

export function getChipSx(stage: CrmStatusColors): SxProps<Theme> {
  return { bgcolor: stage.softColor, color: stage.color, fontWeight: 800 }
}
