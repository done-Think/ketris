import { radius, shadows, surface } from '@shared/theme/tokens'

export const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.crmDetailPanel,
} as const

export const labelSx = {
  color: 'text.disabled',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
} as const

import type { SxProps, Theme } from '@mui/material'

export const stackSx: SxProps<Theme> = { minHeight: '65vh', p: 3 }

export const alertSx: SxProps<Theme> = { maxWidth: 520 }

export const boxSx: SxProps<Theme> = {
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  p: 3.5,
  '& h1, & h2': { letterSpacing: '0 !important' },
}

export const boxSx2: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    lg: 'repeat(3, minmax(0, 1fr))',
  },
  gap: 2,
  alignItems: 'stretch',
}

export const stackSx2: SxProps<Theme> = { height: '100%' }

export const stackSx3: SxProps<Theme> = { height: { lg: '100%' } }

export const boxSx3: SxProps<Theme> = { pt: 2 }
