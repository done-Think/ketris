import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const dialogTitleSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }

export const boxSx: SxProps<Theme> = { minWidth: 0 }

export const typographySx: SxProps<Theme> = {
  color: brand.magenta[600],
  fontSize: 13,
  fontWeight: 900,
}

export const typographySx2: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: 24,
  fontWeight: 900,
}

export const closeRoundedIconSx: SxProps<Theme> = { fontSize: iconSize.lg }

export const dialogContentSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 2 }

export const stepperSx: SxProps<Theme> = { px: { xs: 0, md: 2 } }

export const boxSx2: SxProps<Theme> = {
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.app,
  p: { xs: 1.6, md: 2 },
}

export const dialogActionsSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }

export function getStepLabelSx(index: number, maxVisitedStepIndex: number): SxProps<Theme> {
  return {
    cursor: index <= maxVisitedStepIndex ? 'pointer' : 'default',
    '& .MuiStepLabel-label': {
      color: index <= maxVisitedStepIndex ? brand.magenta[700] : brand.neutral[500],
      fontSize: 12,
      fontWeight: 900,
    },
  }
}
