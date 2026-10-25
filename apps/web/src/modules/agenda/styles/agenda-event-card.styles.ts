import type { SxProps, Theme } from '@mui/material'
import { brand, surface } from '@shared/theme/tokens'
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
  typography: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    color: tone.color,
    fontSize: 12,
    fontWeight: 900,
  }),
  typography2: {
    color: brand.graphite[500],
    fontSize: 11,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
}
