import type { SxProps, Theme } from '@mui/material'
import { alpha, dashboardLayout, radius, shadows, surface } from '@shared/theme/tokens'
const bodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
export const boxSx: SxProps<Theme> = {
  width: '100%',
  p: 3.5,
  bgcolor: surface.app,
  fontFamily: bodyFontFamily,
  '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root': {
    fontFamily: bodyFontFamily,
  },
  '& h1.MuiTypography-root': {
    fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  },
}

export const paperSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.propertyCard,
}

export const stackSx: SxProps<Theme> = { minHeight: 240 }

export const stackSx2: SxProps<Theme> = { minHeight: 240, px: 2 }

export const typographySx: SxProps<Theme> = { color: 'text.secondary', fontSize: 12.5 }

export const boxSx2: SxProps<Theme> = {
  display: { xs: 'none' },
  [dashboardLayout.desktopMediaQuery]: { display: 'block' },
}

export const boxSx3: SxProps<Theme> = {
  display: { xs: 'block' },
  [dashboardLayout.desktopMediaQuery]: { display: 'none' },
}

export const embeddedBoxSx: SxProps<Theme> = { width: '100%' }
