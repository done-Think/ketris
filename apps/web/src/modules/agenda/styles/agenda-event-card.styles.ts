import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, surface } from '@shared/theme/tokens'
import { agendaCardBaseSx, getAgendaCardPlacementSx } from './agenda-calendar.styles'
import type { AgendaEventToneStyle } from '../types/agenda-event'

export const styles = {
  box: (
    top: number,
    height: number,
    lane: number,
    laneCount: number,
    tone: AgendaEventToneStyle,
  ): SxProps<Theme> => ({
    ...agendaCardBaseSx,
    ...getAgendaCardPlacementSx(top, height, lane, laneCount),
    borderColor: tone.borderColor,
    bgcolor: surface.paper,
    backgroundImage: `linear-gradient(${tone.bgcolor}, ${tone.bgcolor})`,
    cursor: 'pointer',
  }),
  titleRow: { minWidth: 0 } satisfies SxProps<Theme>,
  statusIcon: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    color: tone.color,
    fontSize: iconSize.xs,
    flexShrink: 0,
  }),
  typography: (tone: AgendaEventToneStyle, struckThrough = false): SxProps<Theme> => ({
    color: tone.color,
    fontSize: 12,
    fontWeight: 900,
    textDecoration: struckThrough ? 'line-through' : 'none',
  }),
  typography2: {
    color: brand.graphite[500],
    fontSize: 11,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
}
