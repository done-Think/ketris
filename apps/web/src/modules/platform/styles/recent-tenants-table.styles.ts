import type { SxProps, Theme } from '@mui/material'
import type { RecentTenant } from '../types/platform-overview'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  typography: {
    alignItems: 'center',
    color: brand.graphite[500],
    display: 'flex',
    fontSize: 13.5,
    fontWeight: 900,
    height: '100%',
    py: 0,
    textAlign: 'left',
    width: '100%',
  },
  box: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    overflow: 'hidden',
    p: { xs: 1.45, md: 2.2 },
  },
  typography2: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 900,
    mb: 2,
    textTransform: 'uppercase',
  },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ tenants }: { tenants: readonly RecentTenant[] }): SxProps<Theme> {
  return { height: 56 + tenants.length * 52 }
}
