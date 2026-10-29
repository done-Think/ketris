import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'
import { agendaCardBaseSx } from './agenda-calendar.styles'
import type { AgendaEventToneStyle } from '../types/agenda-event'

export const styles = {
  box: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    ...agendaCardBaseSx,
    display: 'block',
    borderColor: tone.borderColor,
    bgcolor: tone.bgcolor,
    textDecoration: 'none',
  }),
  typography: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    color: tone.color,
    fontSize: 10,
    fontWeight: 800,
  }),
  typography2: {
    color: brand.graphite[500],
    fontSize: 12,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  typography3: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
}
