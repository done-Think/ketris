import { radius, shadows, surface } from '@shared/theme/tokens'

export const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.crmDetailPanel,
} as const

export const labelSx = {
  color: 'text.disabled',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
} as const
