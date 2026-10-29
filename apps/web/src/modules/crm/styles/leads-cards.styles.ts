import type { SxProps, Theme } from '@mui/material'
import { brand, radius, shadows, surface } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = { p: 1.6 }

export const boxSx: SxProps<Theme> = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: brand.neutral[100],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.crmCard,
  p: 1.6,
}

export const stackSx2: SxProps<Theme> = { minWidth: 0 }

export const typographySx: SxProps<Theme> = { fontSize: 17, fontWeight: 800 }

export const typographySx2: SxProps<Theme> = { color: 'text.secondary', fontSize: 15 }

export const typographySx3: SxProps<Theme> = {
  color: brand.neutral[500],
  fontSize: 15,
  fontWeight: 700,
}

export const typographySx4: SxProps<Theme> = { fontSize: 17, fontWeight: 700 }

export const boxSx2: SxProps<Theme> = { textAlign: 'right' }

export const buttonSx: SxProps<Theme> = {
  borderRadius: `${radius.sm}px`,
  fontSize: 16,
  fontWeight: 800,
}
