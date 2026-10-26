import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
  gap: 1.2,
}

export const boxSx2: SxProps<Theme> = {
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  p: 1.2,
}

export const typographySx: SxProps<Theme> = {
  color: brand.neutral[500],
  fontSize: 11,
  fontWeight: 800,
}

export const typographySx2: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: 14,
  fontWeight: 900,
}
