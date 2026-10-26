import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius } from '@shared/theme/tokens'

export const dialogTitleSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }

export const typographySx: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: 22,
  fontWeight: 900,
}

export const closeRoundedIconSx: SxProps<Theme> = { fontSize: iconSize.lg }

export const dialogContentSx: SxProps<Theme> = { px: { xs: 2, md: 2.8 }, pb: 2 }

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: 1.6,
  pt: 0.5,
}

export const rhfTextFieldSx: SxProps<Theme> = { gridColumn: { sm: '1 / -1' } }

export const dialogActionsSx: SxProps<Theme> = {
  px: { xs: 2, md: 2.8 },
  pb: 2.5,
  pt: 0,
  flexWrap: 'wrap',
  gap: 1,
}

export const extraStyleSx1: SxProps<Theme> = {
  borderRadius: `${radius.sm}px`,
  maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
}
