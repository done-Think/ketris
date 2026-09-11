import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const ownerDashboardPanelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.lg}px`,
  boxShadow: shadows.crmListPanel,
}

export const ownerDashboardSectionTitleSx = {
  color: brand.graphite[500],
  fontSize: { xs: 18, md: 20 },
  fontWeight: 700,
  lineHeight: 1.25,
}

export const ownerDashboardMetaSx = {
  color: brand.neutral[500],
  fontSize: 12,
  lineHeight: 1.35,
}
