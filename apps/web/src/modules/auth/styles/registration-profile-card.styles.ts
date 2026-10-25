import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, motion, radius, surface } from '@shared/theme/tokens'

export function getStyles(selected: boolean) {
  return {
    radio: { position: 'absolute', width: 1, height: 1, p: 0, opacity: 0 },
    typography: { mt: 2, fontWeight: 700 },
    typography2: { mt: 0.5 },
    formControlLabel: {
      width: { xs: '100%', sm: 'calc((100% - 16px) / 2)', md: 'calc((100% - 32px) / 3)' },
      minHeight: { xs: 164, md: 188 },
      m: 0,
      p: 3,
      position: 'relative',
      alignItems: 'flex-start',
      border: '1px solid',
      borderColor: selected ? brand.magenta[500] : brand.neutral[100],
      borderRadius: `${radius.md}px`,
      bgcolor: surface.paper,
      boxShadow: selected ? `0 12px 30px ${alpha.magenta[10]}` : `0 10px 28px ${alpha.graphite[8]}`,
      cursor: 'pointer',
      textAlign: 'left',
      transition: motion.transition.card,
      '&:hover': {
        borderColor: selected ? brand.magenta[500] : brand.neutral[300],
        transform: 'translateY(-2px)',
      },
      '&:has(.MuiRadio-root.Mui-focusVisible)': {
        outline: `3px solid ${alpha.magenta[14]}`,
        outlineOffset: 2,
      },
    },
  } satisfies Record<string, SxProps<Theme>>
}
