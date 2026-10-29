import { dashboardPropertyActivityToneStyles } from './property-status.styles'
import type { DashboardActivityTone } from '../types/dashboard-property'
import { radius, alpha, brand, shadows, surface } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  listingSection: { mt: 3 },
  listingText: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  box: {
    display: 'block',
    width: '100%',
    height: { xs: 260, md: 430 },
    objectFit: 'cover',
    borderRadius: `${radius.md}px`,
    mb: 3.2,
  },
  box2: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.md}px`,
    boxShadow: shadows.propertyCard,
    px: { xs: 2.2, md: 3.2 },
    py: { xs: 2.4, md: 3.2 },
  },
  typography: { fontSize: 24, fontWeight: 900, mb: 3 },
  box3: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
    rowGap: 2.6,
    columnGap: 3,
  },
  typography2: { color: brand.neutral[400], fontSize: 13, fontWeight: 900 },
  typography3: { color: 'text.primary', fontSize: 18, fontWeight: 900 },
  box4: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
    gap: 2,
  },
  box5: {
    display: 'block',
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover',
    borderRadius: `${radius.sm}px`,
    mb: 1,
  },
  typography4: { fontSize: 15, fontWeight: 900 },
  chip: {
    height: 22,
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.graphite[6],
    fontSize: 11,
    fontWeight: 800,
  },
  box6: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: 1.4,
  },
  box7: {
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    px: 1.8,
    py: 1.5,
  },
  typography5: { color: brand.neutral[400], fontSize: 12, fontWeight: 900 },
  typography6: { fontSize: 17, fontWeight: 900 },
  typography7: { fontSize: 16, fontWeight: 900 },
  typography8: { color: 'text.secondary', fontSize: 13 },
} satisfies Record<string, SxProps<Theme>>

export function getActivityDotStyles(tone: DashboardActivityTone): SxProps<Theme> {
  return {
    width: 10,
    height: 10,
    borderRadius: `${radius.full}px`,
    bgcolor: dashboardPropertyActivityToneStyles[tone],
    mt: 0.8,
    flexShrink: 0,
  }
}
