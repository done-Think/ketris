import type { SxProps, Theme } from '@mui/material'

import type { DashboardMetricTone } from '../types/dashboard-overview'
import { brand } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
    gap: { xs: 1.2, md: 1.6 },
  },
  box2: { minHeight: { xs: 118, md: 'auto' }, p: { xs: 1.45, md: 2.2 } },
  typography: {
    color: brand.neutral[500],
    fontSize: { xs: 10.5, md: 11 },
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  typography2: {
    mt: { xs: 0.9, md: 0.7 },
    color: brand.graphite[500],
    fontSize: { xs: 22, sm: 28 },
    fontWeight: 900,
    lineHeight: 1.12,
  },
  stack: { mt: { xs: 0.7, md: 0.4 } },
  northIcon: { color: brand.semantic.success, fontSize: 13 },
} satisfies Record<string, SxProps<Theme>>

export function getCaptionStyles(tone: DashboardMetricTone | undefined): SxProps<Theme> {
  return {
    color: tone === 'danger' ? brand.magenta[600] : brand.semantic.success,
    fontSize: { xs: 10.5, md: 11 },
    fontWeight: 900,
    lineHeight: 1.25,
  }
}
