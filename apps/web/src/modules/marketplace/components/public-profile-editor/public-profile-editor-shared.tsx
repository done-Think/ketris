import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

export const editorPanelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 2, md: 2.6 },
} as const
