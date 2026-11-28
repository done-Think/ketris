import { alpha, brand, radius, shadows, supportColor } from '@shared/theme/tokens'
import type { AgendaEventTone, AgendaEventToneStyle } from '../types/agenda-event'

export const agendaCardBaseSx = {
  border: 0,
  borderLeft: '3px solid',
  borderRadius: `${radius.sm}px`,
  px: 1.1,
  py: 0.8,
  overflow: 'hidden',
  textAlign: 'left',
  '&:hover, &:focus-visible': { boxShadow: shadows.crmCardHover },
} as const

export const agendaEventToneStyles: Record<AgendaEventTone, AgendaEventToneStyle> = {
  primary: {
    bgcolor: alpha.magenta[10],
    borderColor: brand.magenta[500],
    color: brand.magenta[600],
  },
  info: {
    bgcolor: supportColor.infoSoft,
    borderColor: brand.semantic.info,
    color: brand.semantic.info,
  },
  warning: {
    bgcolor: supportColor.warningSoft,
    borderColor: brand.semantic.warning,
    color: brand.semantic.warning,
  },
  success: {
    bgcolor: supportColor.successSoft,
    borderColor: brand.semantic.success,
    color: brand.semantic.success,
  },
  neutral: {
    bgcolor: brand.neutral[50],
    borderColor: brand.neutral[400],
    color: brand.neutral[600],
  },
}
