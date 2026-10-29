import type { SxProps, Theme } from '@mui/material'

import { alpha, brand, iconSize, radius, shadows } from '@shared/theme/tokens'

export const styles = {
  title: { px: 3, pt: 2.5, pb: 1 },
  titleText: { color: brand.graphite[500], fontSize: 20, fontWeight: 900 },
  content: { px: 3, py: 2 },
  actions: { px: 3, pb: 2.5 },
  description: { color: brand.neutral[500], fontSize: 13 },
  value: { fontWeight: 800 },
  sectionTitle: { fontWeight: 700 },
  historyList: { m: 0, p: 0, listStyle: 'none' },
  historyItem: { py: 0.6, color: brand.neutral[500], fontSize: 12.5 },
  menuPaper: {
    mt: 0.8,
    minWidth: 220,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.crmListPanel,
  },
  menuIcon: { fontSize: iconSize.md },
} satisfies Record<string, SxProps<Theme>>

export function getMenuIconStyles(danger: boolean): SxProps<Theme> {
  return { color: danger ? brand.semantic.error : brand.neutral[500], minWidth: 34 }
}

export function getMenuTextStyles(danger: boolean) {
  return {
    color: danger ? brand.semantic.error : brand.graphite[500],
    fontSize: 13,
    fontWeight: 800,
  }
}
