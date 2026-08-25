import { componentText, radius, shadows, surface } from '@shared/theme/tokens'

export const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.crmDetailPanel,
} as const

export const labelSx = {
  ...componentText.miniCardMeta,
  color: 'text.disabled',
  fontWeight: 800,
  lineHeight: 1.25,
  textTransform: 'uppercase',
} as const
