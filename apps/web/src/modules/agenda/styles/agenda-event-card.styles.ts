import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, surface } from '@shared/theme/tokens'
import { agendaCardBaseSx } from './agenda-calendar.styles'
import type { AgendaEventToneStyle } from '../types/agenda-event'

export const styles = {
  box: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    ...agendaCardBaseSx,
    width: '100%',
    minWidth: 0,
    minHeight: 82,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.4,
    borderColor: tone.borderColor,
    bgcolor: surface.paper,
    backgroundImage: `linear-gradient(${tone.bgcolor}, ${tone.bgcolor})`,
    cursor: 'pointer',
  }),
  time: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    color: tone.color,
    fontSize: 10,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
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
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  }),
  typography2: {
    color: brand.graphite[500],
    fontSize: 11,
    fontWeight: 700,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  } satisfies SxProps<Theme>,
}
