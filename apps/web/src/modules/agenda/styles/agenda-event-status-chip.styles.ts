import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius } from '@shared/theme/tokens'
import type { AgendaEventToneStyle } from '../types/agenda-event'

export function getAgendaEventStatusChipStyles(tone: AgendaEventToneStyle): SxProps<Theme> {
  return {
    height: 24,
    bgcolor: tone.bgcolor,
    color: tone.color,
    borderRadius: `${radius.full}px`,
    fontSize: 12,
    fontWeight: 800,
    '& .MuiChip-icon': { color: tone.color, fontSize: iconSize.sm },
  }
}
