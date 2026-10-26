import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const cardSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.crmCardCompact,
  p: { xs: 2, md: 2.4 },
} as const

export const labelSx = {
  color: brand.neutral[400],
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
} as const

export const cardTitleSx = { color: brand.graphite[500], fontSize: 15, fontWeight: 900 } as const

export const secondaryButtonSx = {
  minHeight: 36,
  px: 1.6,
  borderColor: alpha.graphite[10],
  color: brand.neutral[600],
  fontSize: 11.5,
  fontWeight: 800,
  whiteSpace: 'nowrap',
} as const

export const primaryButtonSx = {
  minHeight: 36,
  px: 1.7,
  fontSize: 11.5,
  fontWeight: 800,
  whiteSpace: 'nowrap',
} as const
