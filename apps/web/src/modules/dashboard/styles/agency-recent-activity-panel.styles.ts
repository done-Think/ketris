import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, motion, radius } from '@shared/theme/tokens'

export const styles = {
  box: { p: { xs: 2, md: 2.4 } },
  typography: { mb: 1.6, color: brand.graphite[500], fontSize: 15, fontWeight: 900 },
  buttonBase: {
    display: 'block',
    width: '100%',
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    textAlign: 'left',
    transition: motion.transition.interactive,
    '&:hover': {
      bgcolor: alpha.magenta[6],
    },
    '&:last-child': { borderBottom: 0 },
    '&.Mui-focusVisible': {
      boxShadow: `0 0 0 2px ${alpha.magenta[14]}`,
    },
  },
  stack: {
    alignItems: 'center',
    px: 0.8,
    py: 1.2,
  },
  box2: {
    display: 'grid',
    width: 28,
    height: 28,
    flexShrink: 0,
    placeItems: 'center',
    borderRadius: '50%',
    bgcolor: alpha.magenta[8],
    color: brand.magenta[600],
  },
  icon: { fontSize: iconSize.xs },
  box3: { minWidth: 0 },
  typography2: { color: brand.graphite[500], fontSize: 12.5, fontWeight: 900 },
  typography3: { color: brand.neutral[400], fontSize: 10.5, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>
