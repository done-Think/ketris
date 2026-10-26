import type { SxProps, Theme } from '@mui/material'

import type { DashboardActivityAccent } from '../types/dashboard-overview'
import { alpha, brand, motion, radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: { p: { xs: 2, md: 2.4 } },
  typography: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  typography2: { color: brand.neutral[500], fontSize: 12, fontWeight: 700, mt: 2 },
  stack: { mt: 2 },
  box2: {
    display: 'block',
    position: 'relative',
    width: '100%',
    border: 0,
    textAlign: 'left',
    overflow: 'hidden',
    bgcolor: surface.app,
    borderRadius: `${radius.sm}px`,
    px: 1.5,
    py: 1.1,
    pl: 1.8,
    cursor: 'pointer',
    font: 'inherit',
    transition: motion.transition.interactive,
    '&:hover': {
      bgcolor: alpha.magenta[6],
      transform: 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${brand.magenta[500]}`,
      outlineOffset: 2,
    },
  },
  typography3: { color: brand.graphite[500], fontSize: 13, fontWeight: 900 },
  typography4: { color: brand.neutral[500], fontSize: 11, fontWeight: 600 },
} satisfies Record<string, SxProps<Theme>>

const accentColor: Record<DashboardActivityAccent, string> = {
  magenta: brand.magenta[500],
  info: brand.semantic.info,
  warning: brand.semantic.warning,
}

export function getAccentBarStyles(accent: DashboardActivityAccent): SxProps<Theme> {
  return { position: 'absolute', insetBlock: 0, left: 0, width: 4, bgcolor: accentColor[accent] }
}

export function getAccentTimeStyles(accent: DashboardActivityAccent): SxProps<Theme> {
  return { color: accentColor[accent], fontSize: 12, fontWeight: 900 }
}
