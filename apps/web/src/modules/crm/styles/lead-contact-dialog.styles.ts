import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const dialogTitleSx: SxProps<Theme> = { px: { xs: 2, md: 2.6 }, pb: 1, pt: 2.4 }

export const stackSx: SxProps<Theme> = { flex: 1, minWidth: 0 }

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

export const dialogContentSx: SxProps<Theme> = { px: { xs: 2, md: 2.6 }, pb: 2, pt: 1 }

export const boxSx2: SxProps<Theme> = {
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.app,
  p: 1.6,
}

export const typographySx3: SxProps<Theme> = {
  color: brand.neutral[500],
  fontSize: 12,
  fontWeight: 800,
}

export const boxSx3: SxProps<Theme> = {
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  p: 1.6,
}

export const typographySx4: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: 16,
  fontWeight: 900,
  overflowWrap: 'anywhere',
}

export const phoneRoundedIconSx: SxProps<Theme> = { fontSize: iconSize.sm }

export const buttonSx: SxProps<Theme> = { borderRadius: `${radius.sm}px`, fontWeight: 900 }

export const dialogActionsSx: SxProps<Theme> = { px: { xs: 2, md: 2.6 }, pb: 2.4, pt: 0 }
