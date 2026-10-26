import type { SxProps, Theme } from '@mui/material'
import { brand, radius, shadows, surface } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = {
  minWidth: 0,
  minHeight: { xs: 84, sm: 78 },
  overflow: 'hidden',
  px: { xs: 1.2, sm: 2.1 },
  py: { xs: 1.3, sm: 1.5 },
  bgcolor: surface.paper,
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.crmCardCompact,
}

export const configIconSx: SxProps<Theme> = { fontSize: 22 }

export const boxSx: SxProps<Theme> = { width: '100%', minWidth: 0, overflow: 'hidden' }

export const typographySx: SxProps<Theme> = {
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: brand.neutral[500],
  fontSize: { xs: 10, sm: 12 },
  fontWeight: 900,
}

export const typographySx2: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: { xs: 24, sm: 30 },
  lineHeight: 1.1,
  fontWeight: 900,
}

export function getBoxSx(config: { bg: string; color: string }): SxProps<Theme> {
  return {
    width: 42,
    height: 42,
    borderRadius: '50%',
    display: { xs: 'none', sm: 'grid' },
    placeItems: 'center',
    bgcolor: config.bg,
    color: config.color,
  }
}
