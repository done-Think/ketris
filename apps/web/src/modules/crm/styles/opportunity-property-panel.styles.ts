import type { SxProps, Theme } from '@mui/material'
import { brand, radius, surface } from '@shared/theme/tokens'
import { panelSx } from './opportunity-detail.styles'

export const paperSx: SxProps<Theme> = { ...panelSx, p: { xs: 2, md: 2.5 } }

export const typographySx: SxProps<Theme> = {
  mb: 1.35,
  fontSize: 16,
  fontWeight: 800,
  textAlign: 'center',
}

export const stackSx: SxProps<Theme> = {
  p: 1.2,
  bgcolor: surface.app,
  borderRadius: `${radius.sm}px`,
}

export const boxSx: SxProps<Theme> = {
  width: { xs: '100%', sm: 112 },
  height: { xs: 150, sm: 82 },
  flexShrink: 0,
  objectFit: 'cover',
  borderRadius: `${radius.sm}px`,
}

export const boxSx2: SxProps<Theme> = {
  display: 'grid',
  placeItems: 'center',
  width: { xs: '100%', sm: 112 },
  height: { xs: 110, sm: 82 },
  flexShrink: 0,
  borderRadius: `${radius.sm}px`,
  bgcolor: brand.neutral[100],
  color: 'text.disabled',
}

export const typographySx2: SxProps<Theme> = { fontSize: 14, fontWeight: 800 }

export const typographySx3: SxProps<Theme> = { mt: 0.2, fontSize: 11.5 }

export const typographySx4: SxProps<Theme> = {
  color: 'primary.main',
  fontSize: 18,
  fontWeight: 900,
}
