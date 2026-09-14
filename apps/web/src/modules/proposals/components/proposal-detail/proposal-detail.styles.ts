import { brand, radius, shadows, surface } from '@shared/theme/tokens'

export const proposalPanelSx = {
  border: '1px solid',
  borderColor: brand.neutral[100],
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.crmListPanel,
} as const

export const proposalPanelHeaderSx = {
  minHeight: 28,
  pb: 1.5,
  borderBottom: '1px solid',
  borderColor: brand.neutral[100],
} as const

export const proposalPanelTitleSx = {
  color: brand.graphite[500],
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.3,
  letterSpacing: 0,
} as const

export const proposalDetailLabelSx = {
  color: brand.neutral[500],
  fontSize: 10.5,
  fontWeight: 500,
  lineHeight: 1.3,
} as const

export const proposalDetailValueSx = {
  color: brand.graphite[500],
  fontSize: 12.5,
  fontWeight: 700,
  lineHeight: 1.4,
  overflowWrap: 'anywhere',
} as const

export const proposalBindingLabelSx = {
  color: brand.neutral[500],
  fontSize: 9.5,
  fontWeight: 700,
  lineHeight: 1.3,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
} as const
