import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { MaintenanceStatus } from '../types/maintenance'
import { statusStyles } from './maintenance-presentation.styles'

export const styles = {
  panel: {
    bgcolor: surface.paper,
    borderRadius: `${radius.md}px`,
    boxShadow: shadows.crmCardCompact,
    p: { xs: 1.6, md: 2.2 },
  },
  header: { mb: 1, flexWrap: 'wrap', rowGap: 1 },
  title: { color: brand.graphite[500], fontSize: 16, fontWeight: 900 },
  openAll: { ml: 'auto', fontSize: 13, fontWeight: 800 },
  ticket: {
    py: 1.3,
    '&:not(:last-of-type)': { borderBottom: `1px solid ${alpha.graphite[8]}` },
  },
  ticketText: { minWidth: 0, flex: 1 },
  ticketTitle: { fontSize: 14, fontWeight: 800, overflowWrap: 'anywhere' },
  meta: { color: brand.neutral[500], fontSize: 12, overflowWrap: 'anywhere' },
  empty: { color: 'text.secondary', fontSize: 14, py: 1 },
} satisfies Record<string, SxProps<Theme>>

export function getTicketStatusChipStyles(status: MaintenanceStatus): SxProps<Theme> {
  return { height: 24, flexShrink: 0, fontSize: 11, fontWeight: 900, ...statusStyles[status] }
}
