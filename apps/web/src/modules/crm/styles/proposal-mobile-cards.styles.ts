import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = { display: { xs: 'flex', md: 'none' } }

export const stackSx2: SxProps<Theme> = { p: 2 }

export const typographySx: SxProps<Theme> = { fontSize: 16, fontWeight: 800 }

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 1.5,
}

export const typographySx2: SxProps<Theme> = {
  color: brand.neutral[500],
  fontSize: 14,
  fontWeight: 700,
  textTransform: 'uppercase',
}

export const typographySx3: SxProps<Theme> = { fontSize: 16, fontWeight: 700 }

export const typographySx4: SxProps<Theme> = { color: 'text.secondary', fontSize: 15 }

export const typographySx5: SxProps<Theme> = { fontSize: 17, fontWeight: 800 }

export const typographySx6: SxProps<Theme> = { color: 'text.secondary', fontSize: 15.5 }
