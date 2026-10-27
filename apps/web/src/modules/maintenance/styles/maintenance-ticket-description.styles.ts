import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
  gap: 1.5,
  mt: 1.7,
}

export const typographySx: SxProps<Theme> = {
  mt: 0.35,
  color: brand.graphite[500],
  fontSize: 12,
  fontWeight: 900,
}

export const dividerSx: SxProps<Theme> = { my: 1.8 }

export const typographySx2: SxProps<Theme> = {
  mt: 0.7,
  color: brand.neutral[600],
  fontSize: 13,
  lineHeight: 1.5,
}
