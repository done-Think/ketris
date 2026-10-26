import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

export const boxSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', gap: 0.8 }

export function getBoxSx(active: boolean): SxProps<Theme> {
  return {
    display: 'grid',
    minWidth: 26,
    height: 26,
    placeItems: 'center',
    px: 0.6,
    borderRadius: `${radius.full}px`,
    bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
    color: active ? surface.lightText : brand.neutral[500],
    fontSize: 15,
    fontWeight: 900,
  }
}
