import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { chargeStatusStyles } from '../config/charge-status'
import type { ContractChargeMonthStatus } from '../types/charge'

const monthStatusColors: Record<ContractChargeMonthStatus, { bgcolor: string; color: string }> = {
  paid: chargeStatusStyles.paid,
  overdue: chargeStatusStyles.overdue,
  upcoming: chargeStatusStyles.pending,
  cancelled: chargeStatusStyles.cancelled,
}

export const styles = {
  months: { gap: 1.6 },
  month: {
    bgcolor: surface.paper,
    borderRadius: `${radius.md}px`,
    boxShadow: shadows.crmCardCompact,
    overflow: 'hidden',
  },
  monthHeader: {
    px: { xs: 1.6, md: 2.2 },
    py: 1.4,
    bgcolor: brand.neutral[50],
    borderBottom: `1px solid ${alpha.graphite[8]}`,
    flexWrap: 'wrap',
    rowGap: 1,
  },
  monthName: {
    color: brand.graphite[500],
    fontSize: 15,
    fontWeight: 900,
    '&::first-letter': { textTransform: 'uppercase' },
  },
  monthTotal: { ml: 'auto', color: brand.graphite[500], fontSize: 14, fontWeight: 800 },
  charge: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr) auto',
      md: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) 120px',
    },
    alignItems: 'center',
    gap: { xs: 0.8, md: 2 },
    px: { xs: 1.6, md: 2.2 },
    py: 1.3,
    '&:not(:last-of-type)': { borderBottom: `1px solid ${alpha.graphite[8]}` },
  },
  chargeTitle: { minWidth: 0 },
  code: { display: 'inline-block', fontSize: 13, fontWeight: 900 },
  description: { color: brand.neutral[500], fontSize: 12, overflowWrap: 'anywhere' },
  muted: { color: brand.neutral[500], fontSize: 13 },
  amount: { color: brand.graphite[500], fontSize: 14, fontWeight: 800 },
  status: { justifySelf: 'end' },
  receipt: { gridColumn: '1 / -1', justifySelf: 'end', minWidth: 0, overflowWrap: 'anywhere' },
  empty: { color: 'text.secondary', fontSize: 14, p: 2 },
  loading: { p: 3 },
} satisfies Record<string, SxProps<Theme>>

export function getMonthStatusChipStyles(status: ContractChargeMonthStatus): SxProps<Theme> {
  return {
    height: 26,
    ...monthStatusColors[status],
    borderRadius: `${radius.full}px`,
    fontWeight: 900,
    fontSize: 12,
  }
}
