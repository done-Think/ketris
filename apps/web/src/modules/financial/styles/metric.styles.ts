import type { SxProps, Theme } from '@mui/material'
import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import { chargeStatusStyles } from '../config/charge-status'
import type { MetricTone } from '../types/charge'

const toneStyles: Record<MetricTone, { bgcolor: string; color: string }> = {
  success: { bgcolor: chargeStatusStyles.paid.bgcolor, color: 'success.main' },
  error: { bgcolor: chargeStatusStyles.overdue.bgcolor, color: 'error.main' },
  warning: { bgcolor: chargeStatusStyles.pending.bgcolor, color: 'warning.dark' },
}

export const styles = {
  card: {
    minHeight: 76,
    p: 2,
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.crmCardCompact,
  },
  text: { minWidth: 0, overflowWrap: 'anywhere' },
  label: { fontSize: 11.5, color: brand.neutral[500] },
  value: { fontSize: { xs: 19, md: 20 }, fontWeight: 900 },
} satisfies Record<string, SxProps<Theme>>

export function getMetricIconStyles(tone: MetricTone): SxProps<Theme> {
  return {
    display: 'grid',
    placeItems: 'center',
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: '50%',
    ...toneStyles[tone],
  }
}
