import type { SxProps, Theme } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { brand, radius, surface } from '@shared/theme/tokens'

export function getStyles(hasError: boolean) {
  return {
    box: { display: 'flex', gap: { xs: 0.75, sm: 1.25 }, justifyContent: 'center' },
    box2: {
      width: { xs: 32, sm: 48 },
      height: { xs: 36, sm: 52 },
      textAlign: 'center',
      fontSize: { xs: 15, sm: 20 },
      fontWeight: 600,
      fontFamily: 'inherit',
      color: brand.graphite[500],
      borderRadius: `${radius.sm}px`,
      border: `1px solid ${hasError ? brand.semantic.error : brand.neutral[100]}`,
      bgcolor: surface.paper,
      outline: 'none',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      '&:focus': {
        borderColor: brand.magenta[500],
        boxShadow: `0 0 0 3px ${muiAlpha(brand.magenta[500], 0.15)}`,
      },
    },
    typography: { color: brand.semantic.error, textAlign: 'center', mt: 0.75 },
  } satisfies Record<string, SxProps<Theme>>
}
