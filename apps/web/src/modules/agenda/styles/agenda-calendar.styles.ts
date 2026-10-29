import { alpha, brand, radius, shadows, supportColor, surface } from '@shared/theme/tokens'
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
}

export function getAgendaCardPlacementSx(top: number, height: number, lane = 0, laneCount = 1) {
  const shift = lane * Math.min(24, 80 / Math.max(1, laneCount - 1))
  return {
    position: 'absolute',
    top,
    height,
    left: { xs: `${8 + shift}px`, md: `${16 + shift}px` },
    right: { xs: 8, md: 16 },
    zIndex: lane + 1,
    bgcolor: surface.paper,
    boxSizing: 'border-box',
    transition: 'box-shadow 160ms ease, transform 160ms ease',
    '&:hover, &:focus-within, &:focus-visible': {
      height: 'auto',
      minHeight: height,
      zIndex: 1000,
      boxShadow: shadows.crmCardHover,
      transform: 'translateY(-1px)',
      outline: 'none',
      '& .MuiTypography-root': {
        whiteSpace: 'normal',
        overflow: 'visible',
        textOverflow: 'clip',
        overflowWrap: 'anywhere',
      },
    },
  } as const
}
