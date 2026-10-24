import { brand, iconSize, motion, radius, surface } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
    gap: { xs: 2, md: 2.4 },
    mb: 2.4,
  },
  typography: { color: brand.neutral[500], fontSize: 13, fontWeight: 800, mb: 0.8 },
  select: {
    height: 44,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 14,
  },
  box2: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center' },
  typography2: { color: brand.neutral[500], fontSize: 13, fontWeight: 800, mb: 0.8 },
  box3: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: '10px',
    rowGap: 0.8,
  },
} satisfies Record<string, SxProps<Theme>>

export function getPurposeOptionStyles(active: boolean): SxProps<Theme> {
  return {
    minHeight: 44,
    color: active ? 'primary.main' : 'text.secondary',
    mx: 0,
    px: 0,
    transition: motion.transition.interactive,
    '& .MuiCheckbox-root': {
      color: active ? 'primary.main' : brand.neutral[400],
      p: 0.6,
      mr: 0.6,
      '& .MuiSvgIcon-root': {
        fontSize: iconSize.md,
      },
    },
    '& .MuiFormControlLabel-label': {
      fontSize: 14,
      fontWeight: 900,
      transform: 'translateY(1px)',
    },
    '&:hover': {
      color: 'primary.main',
    },
  }
}
