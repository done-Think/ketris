import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, surface } from '@shared/theme/tokens'

export const styles = {
  code: { minWidth: 0, p: 0, color: brand.graphite[500], fontSize: 15.5, fontWeight: 900 },
  property: { color: 'text.secondary', fontSize: 14 },
  amount: { fontWeight: 800, fontSize: 15.5 },
  dueDate: { color: 'text.secondary', fontSize: 15.5 },
  iconButton: { color: brand.neutral[500], '&:hover': { color: 'primary.main' } },
  icon: { fontSize: iconSize.md },
} satisfies Record<string, SxProps<Theme>>

export function getChargeRowStyles(zebra: boolean): SxProps<Theme> {
  return {
    height: 58,
    bgcolor: zebra ? surface.app : surface.paper,
    '&:hover': { bgcolor: alpha.graphite[6] },
  }
}
