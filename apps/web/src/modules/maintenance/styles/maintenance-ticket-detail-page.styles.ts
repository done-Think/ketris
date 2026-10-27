import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'
import { priorityColors, statusStyles } from './maintenance-presentation.styles'

export const boxSx: SxProps<Theme> = { width: '100%', p: 3.5 }

export const typographySx: SxProps<Theme> = {
  color: brand.neutral[500],
  fontSize: 14,
  fontWeight: 700,
}

export const typographySx2: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: 24,
  fontWeight: 900,
}

export const stackSx: SxProps<Theme> = { width: '100%' }

export const boxSx2: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.55,
  width: 'fit-content',
  color: brand.neutral[600],
  fontSize: 12,
  fontWeight: 700,
  textDecoration: 'none',
}

export const arrowBackRoundedIconSx: SxProps<Theme> = { fontSize: 15 }

export const typographySx3: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: { xs: 21, md: 24 },
  fontWeight: 900,
}

export const boxSx3: SxProps<Theme> = {
  width: 4,
  height: 4,
  borderRadius: '50%',
  bgcolor: brand.neutral[500],
}

export const typographySx4: SxProps<Theme> = {
  color: brand.graphite[500],
  fontSize: { xs: 18, md: 20 },
  fontWeight: 900,
}

export const typographySx5: SxProps<Theme> = { fontSize: 11, fontWeight: 800 }

export const boxSx4: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1.5fr)' },
  gap: 3,
  alignItems: 'start',
}

export const boxSx5: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(300px, 1fr)' },
  gap: 2,
}

export function getChipSx(status: keyof typeof statusStyles): SxProps<Theme> {
  return {
    height: 21,
    ...statusStyles[status],
    fontSize: 10,
    fontWeight: 900,
  }
}

export function getBoxSx(priority: keyof typeof priorityColors): SxProps<Theme> {
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    bgcolor: priorityColors[priority],
  }
}
