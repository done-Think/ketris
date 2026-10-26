import type { SxProps, Theme } from '@mui/material'
import { brand, supportColor } from '@shared/theme/tokens'

import type { DashboardRecentLeadStatus, DashboardStatusStyle } from '../types/dashboard-overview'

export const styles = {
  box: { p: { xs: 2, md: 2.4 } },
  typography: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  typography2: { color: brand.neutral[500], fontSize: 13, fontWeight: 700, mt: 1.6 },
  tableContainer: { mt: 1.4 },
  table: { minWidth: 820 },
  tableCell: {
    borderBottom: 'none',
    color: brand.neutral[500],
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  tableCell2: { borderBottom: 'none', py: 1.1 },
  typography3: { color: brand.graphite[500], fontSize: 13, fontWeight: 900 },
  typography4: { color: brand.neutral[500], fontSize: 13, fontWeight: 700 },
  typography5: {
    color: brand.neutral[500],
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  muiLink: { color: brand.magenta[600], fontSize: 12, fontWeight: 900 },
  muiLink2: { color: brand.neutral[500], fontSize: 12, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>

const statusColors: Record<DashboardRecentLeadStatus, DashboardStatusStyle> = {
  new: { bgcolor: brand.magenta[50], color: brand.magenta[600] },
  inProgress: { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  qualified: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  pending: { bgcolor: brand.magenta[50], color: brand.magenta[600] },
}

export function getStatusChipStyles(status: DashboardRecentLeadStatus): SxProps<Theme> {
  return { height: 22, ...statusColors[status], fontSize: 10, fontWeight: 900 }
}
