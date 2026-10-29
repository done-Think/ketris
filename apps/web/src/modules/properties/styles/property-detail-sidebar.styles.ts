import { dashboardPropertyActivityToneStyles } from './property-status.styles'
import type { DashboardActivityTone } from '../types/dashboard-property'
import { radius, alpha, brand, shadows, surface } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { width: { xs: '100%', lg: 300, xl: 340 }, flexShrink: 0 },
  box: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.md}px`,
    boxShadow: shadows.propertyCard,
    px: 2.8,
    py: 2.8,
  },
  typography: { fontSize: 22, fontWeight: 900, mb: 2.4 },
  avatar: {
    width: 46,
    height: 46,
    bgcolor: brand.neutral[700],
    fontSize: 13,
    fontWeight: 900,
  },
  typography2: { fontSize: 16, fontWeight: 900 },
  chip: {
    height: 20,
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.graphite[6],
    fontSize: 11,
    fontWeight: 800,
  },
  box2: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.md}px`,
    boxShadow: shadows.propertyCard,
    px: 2.8,
    py: 2.8,
  },
  typography3: { fontSize: 22, fontWeight: 900, mb: 2.5 },
  typography4: { fontSize: 15.5, fontWeight: 700 },
  typography5: { color: 'text.secondary', fontSize: 13 },
} satisfies Record<string, SxProps<Theme>>

export function getActivityDotStyles(tone: DashboardActivityTone): SxProps<Theme> {
  return {
    width: 9,
    height: 9,
    borderRadius: `${radius.full}px`,
    bgcolor: dashboardPropertyActivityToneStyles[tone],
    mt: 0.8,
    flexShrink: 0,
  }
}
