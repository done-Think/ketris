import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize } from '@shared/theme/tokens'

export const dialogTitleSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }

export const boxSx: SxProps<Theme> = { minWidth: 0 }

export const typographySx: SxProps<Theme> = {
  color: brand.magenta[600],
  fontSize: 13,
  fontWeight: 900,
}

export const typographySx2: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: 22,
  fontWeight: 900,
}

export const closeRoundedIconSx: SxProps<Theme> = { fontSize: iconSize.lg }

export const dialogContentSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 2 }

export const dialogActionsSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }
