import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius, shadows } from '@shared/theme/tokens'

export const styles = {
  icon: { fontSize: iconSize.sm },
  paper: { mt: 0.6, minWidth: 180, borderRadius: `${radius.sm}px`, boxShadow: shadows.popover },
} satisfies Record<string, SxProps<Theme>>

export function getMonthOptionStyles(selected: boolean): SxProps<Theme> {
  return { fontSize: 14, fontWeight: selected ? 900 : 700 }
}
