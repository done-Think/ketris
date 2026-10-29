import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: { xs: 0.8, md: 1.5 },
  mt: 2,
}

export const paperSx: SxProps<Theme> = {
  display: 'flex',
  minWidth: 0,
  minHeight: { xs: 84, md: 88 },
  alignItems: { xs: 'flex-start', md: 'center' },
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 0.7, md: 1.5 },
  overflow: 'hidden',
  px: { xs: 1.2, md: 2 },
  py: { xs: 1.2, md: 1.5 },
  borderColor: brand.neutral[100],
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: 'none',
}

export const iconSx: SxProps<Theme> = { fontSize: iconSize.xl }

export const stackSx: SxProps<Theme> = { width: '100%', minWidth: 0 }

export const typographySx: SxProps<Theme> = {
  color: 'text.secondary',
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: { xs: 10, md: 15 },
  fontWeight: { xs: 900, md: 400 },
  lineHeight: { xs: 1.2, md: 1.35 },
  textTransform: { xs: 'uppercase', md: 'none' },
}

export const typographySx2: SxProps<Theme> = {
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: { xs: 20, md: 24 },
  fontWeight: 800,
  lineHeight: 1.2,
}

export function getBoxSx(backgroundColor: string, color: string): SxProps<Theme> {
  return {
    display: { xs: 'none', md: 'grid' },
    width: 40,
    height: 40,
    flexShrink: 0,
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: backgroundColor,
    color,
  }
}
